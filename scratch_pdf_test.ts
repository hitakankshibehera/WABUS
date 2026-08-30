import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

async function testPdf() {
  const qrBuffer = await QRCode.toBuffer('{"pnr":"BR123456","vehicle":"OD-02-AX-8910","seats":["L1","L2"],"hash":"hash123"}', { width: 300, margin: 2 });
  
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];

  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {
    const finalBuffer = Buffer.concat(chunks);
    console.log('✅ PDF Ticket Generated successfully! Size in bytes:', finalBuffer.length);
  });
  doc.on('error', err => console.error('❌ PDF Error:', err));

  // PDF Header
  doc.rect(40, 40, 515, 60).fill('#555151ff');
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('wABus OFFICIAL E-TICKET', 60, 52);
  doc.fontSize(10).font('Helvetica').text('Wonderlight Adventure Company • Official Boarding Pass', 60, 78);

  // PNR Box
  doc.rect(40, 110, 515, 45).fill('#F8FAFC').stroke('#E2E8F0');
  doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text('BOOKING REFERENCE PNR', 55, 118);
  doc.fillColor('#D84E55').fontSize(20).font('Helvetica-Bold').text('BR123456', 55, 130);

  doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text('BUS REGISTRATION NO.', 350, 118);
  doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('OD-02-AX-8910', 350, 132);

  // Details Table
  let y = 170;
  doc.rect(40, y, 515, 230).fill('#FFFFFF').stroke('#E2E8F0');

  const rows = [
    ['Journey Route:', 'Bhubaneswar ➔ Puri'],
    ['Departure Date & Time:', '2026-08-31 at 21:30'],
    ['Coach Operator:', 'OSRTC Volvo Premier (Volvo 9600)'],
    ['Confirmed Seats:', 'L1, L2'],
    ['Passenger(s):', 'Rahul Sharma (M, 26y)'],
    ['Boarding Point:', 'Bhubaneswar Central ISBT (21:30)'],
    ['Dropping Point:', 'Puri Main Terminal (06:00)'],
    ['Total Amount Paid:', 'INR 1,200 (ONLINE)']
  ];

  let rowY = y + 15;
  rows.forEach(([label, value]) => {
    doc.fillColor('#64748B').font('Helvetica-Bold').fontSize(10).text(label, 55, rowY);
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10).text(value, 200, rowY, { width: 340 });
    rowY += 24;
  });

  // QR Code Section
  doc.rect(40, 420, 515, 170).fill('#FAFAFA').stroke('#CBD5E1');
  if (qrBuffer) {
    doc.image(qrBuffer, 60, 435, { width: 140, height: 140 });
  }

  doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Conductor Verification QR Code', 220, 445);
  doc.fillColor('#475569').fontSize(9).font('Helvetica').text('Show this QR code to the conductor upon boarding for instant verification.', 220, 465, { width: 310 });
  doc.fillColor('#D84E55').fontSize(9).font('Helvetica-Bold').text('Verified Token: wabus:ticket:BR123456', 220, 495, { width: 310 });
  doc.fillColor('#16A34A').fontSize(10).font('Helvetica-Bold').text('Status: CONFIRMED & PAID', 220, 515);

  doc.fontSize(8).fillColor('#94A3B8').font('Helvetica').text('Dispatched by Wonderlight Adventure Company Official API Gateway (+91 94383 18821).', 40, 610, { align: 'center', width: 515 });

  doc.end();
}

testPdf();
