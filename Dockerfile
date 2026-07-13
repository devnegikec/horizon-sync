FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

# Host App (root)
COPY dist/apps/platform /usr/share/nginx/html

# Remote App (subpath)
COPY dist/apps/inventory /usr/share/nginx/html/inventory

COPY nginx.conf /etc/nginx/conf.d/default.conf
