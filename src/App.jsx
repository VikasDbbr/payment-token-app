import React, { useState, useEffect, useRef } from 'react';
import { Camera, Download, UserPlus, Hash, Clock, Phone, Users, FileText, CheckCircle2, Upload, Settings, Save } from 'lucide-react';

const PaymentTokenApp = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    numberOfPeople: 1,
    paymentConfirmed: false,
    receiptImage: null,
    amountPaid: 0
  });
  const [entries, setEntries] = useState([]);
  const [nextTokenNumber, setNextTokenNumber] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [unitPrice, setUnitPrice] = useState(100);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [tempUnitPrice, setTempUnitPrice] = useState(100);
  const [googleScriptUrl, setGoogleScriptUrl] = useState(''); // Add your Google Apps Script URL here
  const qrCodeImageUrl = 'https://raphashealth.com/FDB.jpeg';
  const [googleScriptUrl, setGoogleScriptUrl] = useState('https://script.google.com/u/0/home/projects/1u1CDCxAKy-OGpk6QNl6qT0z4J2tYDAXb82v3zE8Gp69dmufXf2RiYpL5/edit');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Google Sheets Integration
  const sendToGoogleSheets = async (data) => {
    if (!googleScriptUrl) {
      console.log('Google Script URL not configured');
      return;
    }
    
    try {
      const response = await fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      console.log('Data sent to Google Sheets');
    } catch (error) {
      console.error('Error sending to Google Sheets:', error);
    }
  };

  // Load saved settings
  useEffect(() => {
    const savedUnitPrice = localStorage.getItem('unitPrice');
    const savedGoogleUrl = localStorage.getItem('googleScriptUrl');
    const savedNextToken = localStorage.getItem('nextTokenNumber');
    
    if (savedUnitPrice) setUnitPrice(parseInt(savedUnitPrice));
    if (savedGoogleUrl) setGoogleScriptUrl(savedGoogleUrl);
    if (savedNextToken) setNextTokenNumber(parseInt(savedNextToken));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberOfPeopleChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setFormData(prev => ({
      ...prev,
      numberOfPeople: value
    }));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        receiptImage: file.name
      }));
    }
  };

  const submitEntry = async () => {
    const timestamp = new Date().toLocaleString();
    const newEntries = [];
    
    for (let i = 0; i < formData.numberOfPeople; i++) {
      const entry = {
        timestamp,
        name: formData.name,
        phone: formData.phone,
        numberOfPeople: formData.numberOfPeople,
        paymentConfirmed: formData.paymentConfirmed,
        amountPaid: formData.amountPaid,
        unitPrice: unitPrice,
        receiptImage: formData.receiptImage || 'No receipt uploaded',
        tokenNumber: nextTokenNumber + i
      };
      newEntries.push(entry);
      
      // Send each entry to Google Sheets
      await sendToGoogleSheets(entry);
    }

    setEntries(prev => [...prev, ...newEntries]);
    const newNextToken = nextTokenNumber + formData.numberOfPeople;
    setNextTokenNumber(newNextToken);
    localStorage.setItem('nextTokenNumber', newNextToken.toString());
    
    // Reset form
    setFormData({
      name: '',
      phone: '',
      numberOfPeople: 1,
      paymentConfirmed: false,
      receiptImage: null,
      amountPaid: 0
    });
    setCurrentStep(4);
    setScanResult('');
  };

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Name', 'Phone Number', 'Number of People', 'Payment Confirmed', 'Amount Paid', 'Unit Price', 'Receipt Image', 'Token Number'];
    const csvContent = [
      headers.join(','),
      ...entries.map(entry => [
        `"${entry.timestamp}"`,
        `"${entry.name}"`,
        `"${entry.phone}"`,
        entry.numberOfPeople,
        entry.paymentConfirmed ? 'Yes' : 'No',
        entry.amountPaid,
        entry.unitPrice || unitPrice,
        `"${entry.receiptImage}"`,
        entry.tokenNumber
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_tokens_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setCurrentStep(1);
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') { // Change this password
      setShowAdminPanel(true);
      setTempUnitPrice(unitPrice);
      setAdminPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const saveAdminSettings = () => {
    setUnitPrice(tempUnitPrice);
    localStorage.setItem('unitPrice', tempUnitPrice.toString());
    localStorage.setItem('googleScriptUrl', googleScriptUrl);
    setShowAdminPanel(false);
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Admin Settings Button */}
        <div className="text-right mb-4">
          <button
            onClick={() => {
              const password = prompt('Enter admin password:');
              setAdminPassword(password || '');
              if (password) handleAdminLogin();
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2 ml-auto"
          >
            <Settings className="w-4 h-4" />
            Admin Settings
          </button>
        </div>

        {/* Admin Panel */}
        {showAdminPanel && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Settings className="text-indigo-600" />
              Admin Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Unit Price per Ride (₹)</label>
                <input
                  type="number"
                  value={tempUnitPrice}
                  onChange={(e) => setTempUnitPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Google Apps Script URL</label>
                <input
                  type="text"
                  value={googleScriptUrl}
                  onChange={(e) => setGoogleScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">Enter your Google Apps Script Web App URL for automatic Google Sheets integration</p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={saveAdminSettings}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </button>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Hash className="text-indigo-600" />
            Payment Token Registration System
          </h1>
          <p className="text-gray-600 mb-8">Register, pay, and receive your unique token number</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-full h-1 mx-2 transition-all ${
                    currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} style={{ width: '60px' }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: User Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="text-indigo-600" />
                User Information
              </h2>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">Unit Price per Ride: ₹{unitPrice}</p>
                <p className="text-blue-600 text-sm mt-1">Total Amount: ₹{unitPrice * formData.numberOfPeople}</p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Number of People
                </label>
                <input
                  type="number"
                  name="numberOfPeople"
                  value={formData.numberOfPeople}
                  onChange={handleNumberOfPeopleChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Each person will receive a unique token number</p>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                disabled={!formData.name || !formData.phone}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                Proceed to Payment (₹{unitPrice * formData.numberOfPeople})
              </button>
            </div>
          )}

          {/* Step 2: QR Code Scan */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Camera className="text-indigo-600" />
                Scan Payment QR Code
              </h2>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 font-medium">Amount to Pay: ₹{unitPrice * formData.numberOfPeople}</p>
                <p className="text-yellow-600 text-sm mt-1">Please pay the exact amount for {formData.numberOfPeople} person(s)</p>
              </div>

              <div className="text-center">
                <img 
                  src={qrCodeImageUrl} 
                  alt="Payment QR Code" 
                  className="mx-auto max-w-sm rounded-lg shadow-lg mb-4"
                />
                <p className="text-gray-600 mb-4">Scan this QR code to make payment</p>
              </div>

              <div className="text-center space-y-4">
                <button
                  onClick={() => {
                    setScanResult('Payment QR Code Scanned Successfully');
                    setFormData(prev => ({
                      ...prev,
                      paymentConfirmed: true,
                      amountPaid: unitPrice * formData.numberOfPeople
                    }));
                    setCurrentStep(3);
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
                >
                  Confirm Payment Made
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-gray-600 hover:text-gray-800 underline block"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload Receipt */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Payment Confirmation
              </h2>

              <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="text-green-600 w-6 h-6" />
                <p className="text-green-800 font-medium">{scanResult}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Amount Paid
                </label>
                <input
                  type="number"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter amount paid"
                  required
                />
                {formData.amountPaid > 0 && formData.amountPaid !== unitPrice * formData.numberOfPeople && (
                  <p className="text-red-600 text-sm mt-2 font-medium">
                    Please pay the complete amount of ₹{unitPrice * formData.numberOfPeople}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  <Upload className="inline w-4 h-4 mr-1" />
                  Upload Payment Receipt (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-100 border-2 border-dashed border-gray-300 py-8 rounded-lg hover:bg-gray-50 transition-all"
                >
                  {formData.receiptImage ? (
                    <div className="text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="text-gray-700">{formData.receiptImage}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload receipt image</p>
                    </div>
                  )}
                </button>
              </div>

              <button
                onClick={submitEntry}
                disabled={formData.amountPaid !== unitPrice * formData.numberOfPeople}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                Complete Registration
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="text-center space-y-6">
              <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-800">Registration Successful!</h2>
              
              <div className="bg-indigo-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">Your token number(s):</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {Array.from({ length: formData.numberOfPeople }, (_, i) => (
                    <div key={i} className="bg-indigo-600 text-white text-2xl font-bold px-6 py-3 rounded-lg">
                      #{nextTokenNumber - formData.numberOfPeople + i}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={resetForm}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105"
              >
                Register Another Person
              </button>
            </div>
          )}
        </div>

        {/* Database View */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="text-indigo-600" />
              Registration Database
            </h2>
            <button
              onClick={downloadCSV}
              disabled={entries.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          {entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Token #</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">People</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Payment</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-semibold text-indigo-600">#{entry.tokenNumber}</td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">{entry.timestamp}</td>
                      <td className="border border-gray-200 px-4 py-2">{entry.name}</td>
                      <td className="border border-gray-200 px-4 py-2">{entry.phone}</td>
                      <td className="border border-gray-200 px-4 py-2 text-center">{entry.numberOfPeople}</td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmed
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">₹{entry.amountPaid}</td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">{entry.receiptImage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Hash className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No registrations yet. Complete the form above to add entries.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTokenApp;