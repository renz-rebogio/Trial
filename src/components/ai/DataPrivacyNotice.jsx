import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const DataPrivacyNotice = () => {
  return (
    <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10 mt-6 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg md:text-xl text-blue-700 dark:text-blue-400">
          <Lock className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-500" />
          Data Privacy and Security
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm md:text-base text-blue-800 dark:text-blue-300 space-y-3">
        <p>
          Your privacy and data security are extremely important to us. When you upload financial documents or transaction data:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-4">
          <li>Your files are encrypted during upload and storage to protect your sensitive information.</li>
          <li>Uploaded documents are used solely for providing AI insights and are permanently deleted after processing, in accordance with our data retention policies.</li>
          <li>We do not share your personal or financial data with third parties without your explicit consent, except as required by law.</li>
        </ul>
        <p>
          Please review our full <Link to="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link> to learn more about how we collect, use, and safeguard your data.
        </p>
        <p>
          By using Boogasi’s AI finance tools, you agree to the collection and processing of your data as described above and in our Privacy Policy.
        </p>
      </CardContent>
    </Card>
  );
};

export default DataPrivacyNotice;