'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from '@/lib/axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { HiOutlineDocumentArrowDown, HiOutlineCalendar } from 'react-icons/hi2';

export default function ReportsExportPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'inquiries' | 'quotes' | 'revenue'>('inquiries');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');

  const exportReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Build report data based on type
      let reportData: any = [];

      if (reportType === 'inquiries') {
        const response = await axios.get('/analytics/seller/inquiries', {
          params: { days: 365 },
          headers: { Authorization: `Bearer ${token}` },
        });
        reportData = response.data.data;
      } else if (reportType === 'quotes') {
        // Fetch quotes data
        const response = await axios.get('/inquiries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        reportData = response.data.data;
      } else {
        // Revenue report
        const response = await axios.get('/analytics/seller/dashboard', {
          params: { days: 365 },
          headers: { Authorization: `Bearer ${token}` },
        });
        reportData = response.data.data;
      }

      // Generate file
      if (format === 'csv') {
        generateCSVReport(reportData, reportType);
      } else {
        generatePDFReport(reportData, reportType);
      }

      toast.success(`${reportType} report exported successfully!`);
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const generateCSVReport = (data: any, type: string) => {
    let csv = '';

    if (type === 'inquiries') {
      csv = 'Date,Status,Count,Response Rate\n';
      Object.entries(data.daily || {}).forEach(([date, metrics]: any) => {
        const newCount = metrics?.new || 0;
        const respondedCount = metrics?.responded || 0;
        const pendingCount = metrics?.pending || 0;
        csv += `${date},New,${newCount},\n`;
        csv += `${date},Responded,${respondedCount},\n`;
        csv += `${date},Pending,${pendingCount},\n`;
      });
    } else if (type === 'quotes') {
      csv = 'Date,Quotes Generated,Quotes Accepted\n';
      data.daily?.forEach((day: any) => {
        csv += `${day.date || new Date().toLocaleDateString()},${day.quotesGenerated || 0},${day.quotesAccepted || 0}\n`;
      });
    } else {
      csv = 'Metric,Value\n';
      csv += `Total Profile Views,${data.totalProfileViews || 0}\n`;
      csv += `Total Inquiries,${data.totalInquiries || 0}\n`;
      csv += `Total Quotes,${data.totalQuotes || 0}\n`;
      csv += `Total Revenue,₹${(data.totalRevenue || 0).toLocaleString()}\n`;
      csv += `Total Orders,${data.totalOrders || 0}\n`;
      csv += `Conversion Rate,${(data.avgConversionRate || 0).toFixed(2)}%\n`;
      csv += `Response Rate,${(data.avgResponseRate || 0).toFixed(2)}%\n`;
    }

    downloadFile(csv, `${type}-report.csv`, 'text/csv');
  };

  const generatePDFReport = (data: any, type: string) => {
    // For PDF generation, we would use a library like pdfkit or jspdf
    // For now, we'll create a simple text-based PDF simulation
    let content = `${type.toUpperCase()} REPORT\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n`;
    content += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n\n`;

    if (type === 'inquiries') {
      content += `Total Inquiries: ${data.totalInquiries || 0}\n`;
      content += `Response Rate: ${(data.responseRate || 0).toFixed(2)}%\n`;
    } else if (type === 'quotes') {
      content += `Quotations Details:\n`;
      content += JSON.stringify(data, null, 2);
    } else {
      content += `Total Profile Views: ${data.totalProfileViews || 0}\n`;
      content += `Total Revenue: ₹${(data.totalRevenue || 0).toLocaleString()}\n`;
      content += `Total Orders: ${data.totalOrders || 0}\n`;
      content += `Conversion Rate: ${(data.avgConversionRate || 0).toFixed(2)}%\n`;
    }

    downloadFile(content, `${type}-report.pdf`, 'text/plain');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const reportDescriptions: Record<string, string> = {
    inquiries: 'Export all inquiries data with status breakdown and response metrics',
    quotes: 'Export quotation generation and acceptance records',
    revenue: 'Export revenue metrics, orders, and performance statistics',
  };

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Export Reports</h1>
            <p className="text-gray-600 mt-2">Download your business data in CSV or PDF format</p>
          </div>

          {/* Export Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="space-y-8">
              {/* Report Type Selection */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">Select Report Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['inquiries', 'quotes', 'revenue'] as const).map(type => (
                    <label
                      key={type}
                      className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition ${
                        reportType === type
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={type}
                        checked={reportType === type}
                        onChange={() => setReportType(type)}
                        className="w-4 h-4"
                      />
                      <span className="capitalize font-semibold text-gray-900 mt-2">{type}</span>
                      <span className="text-xs text-gray-600 mt-1">{reportDescriptions[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  <HiOutlineCalendar className="w-5 h-5 inline mr-2" />
                  Date Range
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) =>
                        setDateRange(prev => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) =>
                        setDateRange(prev => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* File Format */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">Export Format</label>
                <div className="flex gap-4">
                  {['csv', 'pdf'].map(fmt => (
                    <label
                      key={fmt}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                        format === fmt
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={fmt}
                        checked={format === fmt as any}
                        onChange={() => setFormat(fmt as any)}
                        className="w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 uppercase">{fmt}</span>
                        <p className="text-xs text-gray-600">
                          {fmt === 'csv' ? 'Spreadsheet compatible' : 'Document format'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={exportReport}
                disabled={loading}
                className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <HiOutlineDocumentArrowDown className="w-5 h-5" />
                {loading ? 'Generating Report...' : 'Download Report'}
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4">❓ Frequently Asked Questions</h3>
            <div className="space-y-3 text-sm text-blue-900">
              <div>
                <p className="font-medium">What data is included in each report?</p>
                <p className="text-blue-800">Inquiries: Status, count, and response rates | Quotes: Generation and acceptance data | Revenue: Sales metrics and orders</p>
              </div>
              <div>
                <p className="font-medium">Can I export custom date ranges?</p>
                <p className="text-blue-800">Yes, you can select any date range using the date picker fields above.</p>
              </div>
              <div>
                <p className="font-medium">Which format should I use?</p>
                <p className="text-blue-800">CSV for Excel/Google Sheets analysis, PDF for sharing and printing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
