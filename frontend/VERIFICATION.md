# React migration — parity checklist

Run the backend (`npm start`) and the client. For the most realistic check,
build and use the single server:

```bash
npm run build && npm start   # from billing-software/
# open http://localhost:5000
```

Compare behavior against the legacy app, still available by temporarily
pointing the browser at the old file if needed. Tick each item:

## Data + navigation
- [ ] App loads; sidebar shows your company name
- [ ] All six tabs navigate; hard refresh on /saved, /products etc. still loads (SPA fallback)
- [ ] Dashboard stats match (bills, quotations, total billed, products/parties)
- [ ] Recent documents list shows newest first; "Open" loads the editor

## Products
- [ ] List matches; Add / Edit / Delete work and persist after refresh
- [ ] Validation: empty name is rejected

## Parties
- [ ] List matches; Add / Edit / Delete work
- [ ] Duplicate GSTIN shows the 409 error toast

## Settings
- [ ] All fields load from the server and save
- [ ] Changing the default template persists
- [ ] Changing company name updates the sidebar after save

## New document editor
- [ ] New bill / new quotation get the correct next number
- [ ] Product smart-search: typing shows ranked matches + suggestions, highlighting
- [ ] Keyboard nav in dropdown (Arrow/Enter/Escape) works
- [ ] Picking a product fills unit/rate/description/HSN
- [ ] "Save" button appears for a new typed product, saves it, links the row
- [ ] Add/remove rows; amounts and totals recalc live
- [ ] GST modes (None / CGST+SGST / IGST) and rate (incl. custom) compute correctly
- [ ] Amount-in-words matches
- [ ] Save creates the document; counters advance

## Quotation -> bill conversion (the earlier bug)
- [ ] Open a saved quotation, switch type to Bill, Save
- [ ] Original quotation still exists AND a new bill is created (two documents)
- [ ] Switching the type back to the original restores its number and updates in place

## Saved documents
- [ ] Search by number/party and type filter work
- [ ] Edit opens the doc; Delete removes it

## Preview / Print / PDF  (the highest-risk area)
- [ ] Preview opens from the editor and from Saved (Print/PDF buttons)
- [ ] Each of the 6 templates renders correctly (compare to legacy)
- [ ] Modern template header is full-bleed (the earlier fix)
- [ ] GST template shows HSN column + tax summary
- [ ] A multi-item document that spans >1 page splits correctly, totals on last page
- [ ] Print produces a clean A4 (no app chrome, correct page breaks)
- [ ] Download PDF produces the same layout; filename is PartyName-DocNumber.pdf

## Once everything above passes
- [ ] Delete legacy `public/index.html` (and `public/vendor/`), rebuild, confirm still works
