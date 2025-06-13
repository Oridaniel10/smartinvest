import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to fetch an image and convert it to a Base64 string
// This is necessary to embed external images (like from Cloudinary) into the PDF.
const imageToBase64 = (url) => {
    return fetch(url)
      .then(response => response.blob())
      .then(blob => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
}

/**
 * Generates a PDF document for the user's profile.
 * @param {object} profileData - The complete user profile data object.
 */
export const generateProfilePdf = async (profileData) => {
    if (!profileData) {
        console.error("No profile data provided for PDF generation.");
        alert("Could not generate PDF: no data available.");
        return;
    }

    const doc = new jsPDF();

    // --- Document Header ---
    const generationDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    
    // Add profile image
    try {
        const imageUrl = profileData.profile_image;
        // Use a proxy if direct fetch fails due to CORS, but for now, let's try direct.
        const imageBase64 = await imageToBase64(imageUrl);
        doc.addImage(imageBase64, 'JPEG', 15, 15, 30, 30); // x, y, width, height
    } catch (error) {
        console.error("Could not load profile image for PDF:", error);
        // If image fails, we can continue without it.
    }

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartInvest Profile Summary', 60, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${profileData.name}`, 60, 35);
    doc.text(`Email: ${profileData.email}`, 60, 42);
    doc.text(`Report Date: ${generationDate}`, 140, 15);


    // --- Financial Summary Section ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Overview', 15, 60);

    const summaryData = [
        ['Total Equity', profileData.total_equity],
        ['Cash Balance', profileData.balance],
        ['Portfolio Value', profileData.total_portfolio_value],
        ['Unrealized P/L', profileData.unrealized_pl],
        ['Realized P/L', profileData.realized_pl],
        ['Net Contributions', profileData.net_contributions],
        ['Total Commissions Paid', profileData.total_commissions],
    ].map(([label, value]) => [label, new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)]);

    autoTable(doc, {
        startY: 65,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] }, // A green color
    });


    // --- Transactions History Section ---
    const finalY = doc.lastAutoTable.finalY || 120; // Get Y position after the first table
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction History', 15, finalY + 15);

    const transactions = profileData.transactions || [];
    const tableData = transactions.map(t => {
      // 1. Calculate amount based on transaction type, including commission
      let amount = t.amount;
      if (t.type === 'buy') {
        amount = (t.quantity * t.price) + (t.commission || 0);
      } else if (t.type === 'sell') {
        amount = (t.quantity * t.price) - (t.commission || 0);
      }

      // Date formatting logic removed as per user request.

      // 3. Format quantity to a reasonable number of decimal places
      const formattedQuantity = t.quantity ? Number(t.quantity).toFixed(4) : 'N/A';

      return [
        t.type.charAt(0).toUpperCase() + t.type.slice(1), // Capitalize type
        t.symbol || 'N/A',
        formattedQuantity,
        t.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.price) : 'N/A',
        t.commission ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(t.commission) : '$0.00',
        amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount) : 'N/A',
      ];
    });

    autoTable(doc, {
        startY: finalY + 20,
        head: [['Type', 'Symbol', 'Quantity', 'Price', 'Commission', 'Total Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
    });

    // --- Save the PDF ---
    doc.save(`SmartInvest_Profile_${profileData.name.replace(' ', '_')}_${generationDate}.pdf`);
};

/**
 * Generates a text summary of the user's profile for AI context.
 * @param {object} profileData - The complete user profile data object.
 * @returns {string} A string containing the user's profile summary.
 */
export const generateProfileAsText = (profileData) => {
    if (!profileData) return "";

    let summary = `User Profile Summary for ${profileData.name}:\n\n`;

    // Financial Overview
    summary += "--- Financial Overview ---\n";
    summary += `Total Equity: ${formatCurrency(profileData.total_equity)}\n`;
    summary += `Portfolio Value: ${formatCurrency(profileData.total_portfolio_value)}\n`;
    summary += `Cash Balance: ${formatCurrency(profileData.balance)}\n`;
    summary += `Unrealized P/L: ${formatCurrency(profileData.unrealized_pl)}\n`;
    summary += `Realized P/L: ${formatCurrency(profileData.realized_pl)}\n`;
    summary += `Total Commissions Paid: ${formatCurrency(profileData.total_commissions)}\n\n`;
    
    // Holdings
    summary += "--- Current Holdings ---\n";
    if (profileData.portfolio && profileData.portfolio.length > 0) {
        profileData.portfolio.forEach(stock => {
            summary += `${stock.symbol}: ${stock.quantity.toFixed(2)} shares, Current Value: ${formatCurrency(stock.current_value)}, Unrealized P/L: ${formatCurrency(stock.unrealized_pl)}\n`;
        });
    } else {
        summary += "No holdings in the portfolio.\n";
    }
    summary += "\n";

    // Transaction History (last 5 for brevity)
    summary += "--- Recent Transactions (last 5) ---\n";
    if (profileData.transactions && profileData.transactions.length > 0) {
        profileData.transactions.slice(-5).forEach(t => {
            summary += `${t.type.toUpperCase()} ${t.symbol || ''}: ${t.quantity ? t.quantity.toFixed(2) : ''} shares at ${formatCurrency(t.price || 0)}\n`;
        });
    } else {
        summary += "No transaction history.\n";
    }
    
    return summary;
};

// Helper for text generation
const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0); 