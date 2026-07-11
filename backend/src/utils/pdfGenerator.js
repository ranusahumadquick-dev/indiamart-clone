/**
 * PDF Generator Utility
 * Converts HTML to PDF using Puppeteer
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVOICES_DIR = path.join(__dirname, '../../invoices');

// Ensure invoices directory exists
const ensureInvoicesDir = async () => {
  try {
    await fs.mkdir(INVOICES_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating invoices directory:', err);
  }
};

/**
 * Convert HTML to PDF and save to file
 * @param {string} htmlContent - HTML string to convert
 * @param {string} filename - Filename to save (without extension)
 * @returns {Promise<{path: string, filename: string}>} - File path and filename
 */
const htmlToPdf = async (htmlContent, filename) => {
  let browser = null;

  try {
    await ensureInvoicesDir();

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle2'
    });

    // Generate PDF
    const pdfPath = path.join(INVOICES_DIR, `${filename}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true
    });

    await page.close();

    return {
      path: pdfPath,
      filename: `${filename}.pdf`,
      url: `/invoices/${filename}.pdf`
    };
  } catch (err) {
    console.error('PDF generation error:', err);
    throw new Error(`Failed to generate PDF: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Generate PDF in memory (returns buffer)
 * @param {string} htmlContent - HTML string to convert
 * @returns {Promise<Buffer>} - PDF buffer
 */
const htmlToPdfBuffer = async (htmlContent) => {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle2'
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true
    });

    await page.close();

    return pdfBuffer;
  } catch (err) {
    console.error('PDF generation error:', err);
    throw new Error(`Failed to generate PDF: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export { htmlToPdf, htmlToPdfBuffer, INVOICES_DIR };
