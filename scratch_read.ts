import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('THESERVERFACTORY.xlsx');
console.log('Sheets:', workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet);
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log(`Rows: ${json.length}`);
    if (json.length > 0) {
        console.log('Row 1:', json[0]);
    }
}
