# PDF Line Items Debug Instructions

## Issue

Line items are not appearing in the generated PDF for quotations.

## Debug Logging Added

I've added comprehensive console logging to help identify where the data is being lost. The logs are organized in numbered steps for easy tracking.

### Files Modified

1. **apps/inventory/src/app/utils/pdf/quotationToPDF.ts**
   - Added logs 1-10 to track the conversion process
2. **apps/inventory/src/app/utils/pdf/DocumentPDF.tsx**
   - Added logs to track the rendering process

## How to Debug

### Step 1: Open Browser Console

1. Open your application in the browser
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to the Console tab
4. Clear the console (click the 🚫 icon)

### Step 2: Generate a PDF

1. Navigate to a quotation detail page
2. Click the "Download PDF" or "Generate PDF" button
3. Watch the console output

### Step 3: Analyze Console Output

Look for the debug logs in this order:

```
=== PDF CONVERSION DEBUG ===
1. Full quotation object: {...}
2. quotation.items: [...]
3. quotation.line_items: [...]
4. Selected lineItems array: [...]
5. lineItems.length: X
6. Processing item 0: {...}
7. Converted pdfLineItems: [...]
8. pdfLineItems.length: X
9. Final PDFDocumentData: {...}
10. Final lineItems in PDFDocumentData: [...]
=== END PDF CONVERSION DEBUG ===

=== DocumentPDF RENDER DEBUG ===
1. Received data prop: {...}
2. data.lineItems: [...]
3. data.lineItems.length: X
4. Is lineItems an array? true/false
5. About to render, lineItems check: {...}
=== END DocumentPDF RENDER DEBUG ===
```

### Step 4: Identify the Problem

#### Scenario A: No items in quotation object (logs 2-3 show empty/undefined)

**Problem**: Backend is not returning line items
**Solution**: Check the backend API endpoint `/quotations/{id}` to ensure it includes line items

#### Scenario B: Items exist but wrong field name (log 2 or 3 has data, but log 4 is empty)

**Problem**: Field name mismatch between API and frontend
**Solution**: Check which field has data (items vs line_items) and update the code

#### Scenario C: Items lost during conversion (logs 4-5 show data, but logs 7-8 are empty)

**Problem**: Error in the mapping function
**Solution**: Check log 6 for each item to see what's failing

#### Scenario D: Items lost between conversion and rendering (logs 9-10 show data, but DocumentPDF logs show empty)

**Problem**: Data not being passed correctly to PDF component
**Solution**: Check how `convertQuotationToPDFData` is called and how data is passed to `<DocumentPDF>`

#### Scenario E: Items exist in DocumentPDF but not rendering (all logs show data)

**Problem**: React-PDF rendering issue
**Solution**: Check for React-PDF errors in console

## Common Issues and Solutions

### Issue 1: Backend Not Returning Line Items

**Check**: Look at log 1 (Full quotation object)

If you see:

```json
{
  "id": "...",
  "quotation_no": "..."
  // ... other fields but NO items or line_items
}
```

**Solution**: Update the backend API to include line items in the response. The backend should return either:

- `items: [...]` or
- `line_items: [...]`

### Issue 2: Field Name Mismatch

**Check**: Logs 2 and 3

If log 2 shows `undefined` but log 3 shows data (or vice versa):

```
2. quotation.items: undefined
3. quotation.line_items: [{...}, {...}]
```

**Solution**: The API is using a different field name. Update line 4 in `quotationToPDF.ts`:

```typescript
// Current code tries both:
const lineItems = quotation.items || quotation.line_items || [];

// If API uses a different field, add it:
const lineItems = quotation.items || quotation.line_items || quotation.quotation_items || [];
```

### Issue 3: Empty Array

**Check**: Log 5

If you see:

```
5. lineItems.length: 0
```

But the quotation should have items, then either:

- The quotation truly has no items (check in the UI table)
- The backend is returning an empty array

**Solution**: Verify the quotation has items in the database and that the backend query includes them.

### Issue 4: Items Not Rendering in PDF

**Check**: All logs show data but PDF is blank

**Solution**: Check for React-PDF errors:

1. Look for red error messages in console
2. Check if `@react-pdf/renderer` is properly installed: `npm list @react-pdf/renderer`
3. Try simplifying the PDF to test: temporarily replace the map with a static item

## Testing Checklist

After identifying and fixing the issue:

- [ ] Console shows line items in log 1 (Full quotation object)
- [ ] Console shows line items in log 4 (Selected lineItems array)
- [ ] Console shows correct length in log 5
- [ ] Console shows converted items in log 7
- [ ] Console shows items in log 10 (Final PDFDocumentData)
- [ ] Console shows items in DocumentPDF logs
- [ ] PDF displays line items correctly
- [ ] Remove all console.log statements after fixing

## Removing Debug Logs

Once the issue is fixed, remove the debug logs:

1. In `quotationToPDF.ts`: Remove all `console.log` statements
2. In `DocumentPDF.tsx`: Remove all `console.log` statements
3. Test that PDF still works without logs

## Need More Help?

If the issue persists after following these steps:

1. Copy the FULL console output (all logs from step 1-10 and DocumentPDF logs)
2. Take a screenshot of the Network tab showing the `/quotations/{id}` API response
3. Share both with the development team

## Example of Good Output

When everything works correctly, you should see:

```
=== PDF CONVERSION DEBUG ===
1. Full quotation object: { id: "...", items: [{...}, {...}], ... }
2. quotation.items: [{...}, {...}]
3. quotation.line_items: undefined
4. Selected lineItems array: [{...}, {...}]
5. lineItems.length: 2
6. Processing item 0: { item_name: "Widget A", qty: 10, ... }
6. Processing item 1: { item_name: "Widget B", qty: 5, ... }
7. Converted pdfLineItems: [{index: 1, itemName: "Widget A", ...}, {index: 2, itemName: "Widget B", ...}]
8. pdfLineItems.length: 2
9. Final PDFDocumentData: { lineItems: [{...}, {...}], ... }
10. Final lineItems in PDFDocumentData: [{...}, {...}]
=== END PDF CONVERSION DEBUG ===

=== DocumentPDF RENDER DEBUG ===
1. Received data prop: { lineItems: [{...}, {...}], ... }
2. data.lineItems: [{...}, {...}]
3. data.lineItems.length: 2
4. Is lineItems an array? true
5. About to render, lineItems check: { exists: true, isArray: true, length: 2, firstItem: {...} }
=== END DocumentPDF RENDER DEBUG ===

Rendering line item: {index: 1, itemName: "Widget A", ...}
Rendering line item: {index: 2, itemName: "Widget B", ...}
```
