# Backend: Remember Me & Secure Cookie Requirements

The platform frontend sends `remember_me` on login and uses **credentials: 'include'** for login, refresh, and logout. For "Remember Me" and secure sessions, the backend must implement the following.

## 1. Login `POST /identity/login`

- **Request body**: `{ "email", "password", "remember_me"?: boolean }`
- **Behaviour**:
  - Set a **refresh token** in an **HttpOnly cookie** (do not return the refresh token in the JSON body if you use cookie-based refresh).
  - **Cookie attributes** (security):
    - **HttpOnly** – not readable by JavaScript (mitigates XSS). **Always set to true.**
    - **Secure** – only sent over HTTPS. **Set conditionally:**
      - **Development (HTTP)**: `Secure: false` (required for localhost/HTTP)
      - **Production (HTTPS)**: `Secure: true` (required for security)
    - **SameSite=Lax** – reduces CSRF risk while allowing normal top-level navigations. **Always set to Lax.**
  - **Expiry**:
    - If **`remember_me === true`**: set `Max-Age=2592000` (30 days).
    - If **`remember_me === false`** or omitted: do **not** set `Max-Age` (session cookie; expires when the browser/tab closes).
  - Response body: return `access_token` (and optionally `user`). Optionally return `refresh_token` in body for backward compatibility (frontend may use it for logout body if needed).

Example cookie (30 days, Remember Me, **Production**):

```http
Set-Cookie: refresh_token=<token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000
```

Example cookie (30 days, Remember Me, **Development** - note: no Secure flag):

```http
Set-Cookie: refresh_token=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000
```

Example session cookie (no Remember Me, **Production**):

```http
Set-Cookie: refresh_token=<token>; Path=/; HttpOnly; Secure; SameSite=Lax
```

Example session cookie (no Remember Me, **Development** - note: no Secure flag):

```http
Set-Cookie: refresh_token=<token>; Path=/; HttpOnly; SameSite=Lax
```

**Important**: In development (localhost, HTTP), omit the `Secure` flag. In production (HTTPS), always include `Secure`.

## 2. Refresh `POST /identity/refresh`

- **Request**: No body required. Backend reads the refresh token from the **cookie** (sent automatically with `credentials: 'include'`).
- **Response**: JSON with `access_token` and optionally `user`.
- **Behaviour**: Validate the refresh token from the cookie; if valid, issue a new access token (and optionally user). Optionally rotate the refresh token and set a new cookie.

## 3. Logout `POST /identity/logout`

- **Request**: Optional body `{ "refresh_token" }` (frontend may send it if it has one from an older flow). Backend should also accept requests with **no body** and invalidate/clear the refresh token from the **cookie**.
- **Response**: 204 or 200.
- **Behaviour**: Invalidate the refresh token (from body or cookie) and clear the cookie, e.g.:

**Production** (with Secure):
```http
Set-Cookie: refresh_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0
```

**Development** (without Secure):
```http
Set-Cookie: refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0
```

## 4. CORS

- For cookie-based auth, the API must allow the frontend origin in `Access-Control-Allow-Origin` (not `*` when using credentials).
- Set `Access-Control-Allow-Credentials: true` for requests that send cookies.

## 6. Environment Detection

The backend should detect the environment and set the `Secure` flag accordingly:

- **Development**: Check if the request is over HTTP (not HTTPS) or if the host is `localhost`. Set `Secure: false` or omit the `Secure` flag entirely.
- **Production**: Always set `Secure: true` when serving over HTTPS.

Example logic (pseudo-code):
```python
# Python/FastAPI example
is_secure = request.url.scheme == "https" or os.getenv("ENVIRONMENT") == "production"
cookie_attributes = f"HttpOnly; SameSite=Lax"
if is_secure:
    cookie_attributes += "; Secure"
```

```javascript
// Node.js/Express example
const isSecure = req.protocol === 'https' || process.env.NODE_ENV === 'production';
const secureFlag = isSecure ? 'Secure' : '';
res.cookie('refresh_token', token, {
  httpOnly: true,
  secure: isSecure,
  sameSite: 'lax',
  maxAge: rememberMe ? 2592000000 : undefined, // 30 days in milliseconds
});
```

## 5. Frontend behaviour (summary)

- **Access token**: Kept in **memory only** (Zustand store, not persisted). Sent in `Authorization: Bearer <access_token>`.
- **Refresh token**: Stored only in the **HttpOnly cookie** by the backend. Frontend never reads it; it is sent automatically with `credentials: 'include'` to login, refresh, and logout.
- **Session restore**: On app load, if there is no access token in memory, the frontend calls `POST /identity/refresh` with `credentials: 'include'`. If the response is 200, it stores the new access token (and user) in memory and the user stays logged in (e.g. after closing the tab when "Remember Me" was used).
