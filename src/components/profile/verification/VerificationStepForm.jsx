import React, { useState } from 'react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Checkbox } from '@/components/ui/checkbox';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { User, Building, UploadCloud, FileText, ArrowRight, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
    
    const MAX_SUPPORTING_DOCS = 5;
    
    const FileInput = ({ id, label, onChange, multiple = false, accept, disabled, uploadedFilesCount = 0, maxFiles = 1 }) => {
      const filesLabel = uploadedFilesCount > 1 ? "files" : "file";
      const buttonText = uploadedFilesCount > 0 ? `${uploadedFilesCount} ${filesLabel} selected` : `Choose ${filesLabel}`;
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{label} {multiple && `(up to ${maxFiles})`}</Label>
          <div className="flex items-center space-x-2">
            <Input
              id={id}
              type="file"
              accept={accept}
              onChange={onChange}
              multiple={multiple}
              className="hidden"
              disabled={disabled || (multiple && uploadedFilesCount >= maxFiles)}
            />
            <Button type="button" variant="outline" onClick={() => document.getElementById(id).click()} disabled={disabled || (multiple && uploadedFilesCount >= maxFiles)}>
              <UploadCloud className="mr-2 h-4 w-4" />
              {buttonText}
            </Button>
            {multiple && uploadedFilesCount > 0 && <span className="text-xs text-muted-foreground">{uploadedFilesCount}/{maxFiles} uploaded</span>}
          </div>
           {multiple && uploadedFilesCount >= maxFiles && <p className="text-xs text-amber-600">Maximum number of files reached.</p>}
        </div>
      );
    };
    
    const VerificationStepForm = ({ user, investmentProfile, onNext, onBack, fetchInvestmentProfile, fetchDocuments }) => {
      const { toast } = useToast();
      const [applicantType, setApplicantType] = useState(investmentProfile?.applicant_type || 'individual');
      const [formData, setFormData] = useState({
        legalFullName: investmentProfile?.legal_full_name || '',
        residenceAddress: investmentProfile?.residence_address || '',
        companyName: investmentProfile?.company_name || '',
        companyOwnerName: investmentProfile?.company_owner_name || '',
        companyAddress: investmentProfile?.company_address || '',
        companyEIN: investmentProfile?.company_ein || '',
      });
    
      const [govIdFile, setGovIdFile] = useState(null);
      const [proofOfOwnershipFile, setProofOfOwnershipFile] = useState(null);
      const [supportingDocs, setSupportingDocs] = useState([]);
    
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [agreementChecked, setAgreementChecked] = useState(investmentProfile?.confidentiality_agreement_signed || false);
      const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    
      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
      };
    
      const handleGovIdFileChange = (e) => setGovIdFile(e.target.files[0]);
      const handleProofOfOwnershipFileChange = (e) => setProofOfOwnershipFile(e.target.files[0]);
      
      const handleSupportingDocsChange = (e) => {
        const newFiles = Array.from(e.target.files);
        if (supportingDocs.length + newFiles.length > MAX_SUPPORTING_DOCS) {
          toast({
            variant: "destructive",
            title: "Too many files",
            description: `You can upload a maximum of ${MAX_SUPPORTING_DOCS} supporting documents.`,
          });
          e.target.value = null; 
          return;
        }
        setSupportingDocs(prev => [...prev, ...newFiles].slice(0, MAX_SUPPORTING_DOCS));
        e.target.value = null; 
      };
    
      const removeSupportingDoc = (index) => {
        setSupportingDocs(prev => prev.filter((_, i) => i !== index));
      };
    
      const uploadFile = async (file, category) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const filePath = `verification-documents/${user.id}/${category}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('boogasi')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
    
        if (uploadError) throw new Error(`Upload failed for ${category}: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage.from('boogasi').getPublicUrl(filePath);
        return { url: publicUrl, path: uploadData.path, category };
      };
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agreementChecked) {
          toast({ variant: "destructive", title: "Agreement Required", description: "Please agree to the confidentiality policy." });
          return;
        }
        if (applicantType === 'individual' && !govIdFile ) {
            toast({ variant: "destructive", title: "Government ID Required", description: "Please upload your government-issued ID." });
            return;
        }
        if (applicantType === 'company' && !proofOfOwnershipFile) {
            toast({ variant: "destructive", title: "Proof of Ownership Required", description: "Please upload proof of company ownership." });
            return;
        }
        if (supportingDocs.length === 0 ) {
            toast({ variant: "destructive", title: "Supporting Documents Required", description: "Please upload at least one supporting document for proof of funds." });
            return;
        }
    
        setIsSubmitting(true);
        try {
          const profileUpdateData = {
            user_id: user.id,
            applicant_type: applicantType,
            legal_full_name: formData.legalFullName,
            confidentiality_agreement_signed: agreementChecked,
            confidentiality_agreement_date: agreementChecked ? new Date().toISOString() : null,
            verification_status: 'pending_review', 
            updated_at: new Date().toISOString(),
          };
          if (applicantType === 'individual') {
            profileUpdateData.residence_address = formData.residenceAddress;
          } else {
            profileUpdateData.company_name = formData.companyName;
            profileUpdateData.company_owner_name = formData.companyOwnerName;
            profileUpdateData.company_address = formData.companyAddress;
            profileUpdateData.company_ein = formData.companyEIN;
          }
    
          const { error: profileError } = await supabase
            .from('investment_profiles')
            .upsert(profileUpdateData, { onConflict: 'user_id' });
          if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);
    
          const uploadedFileDetails = [];
          if (govIdFile) uploadedFileDetails.push(await uploadFile(govIdFile, 'government_id'));
          if (proofOfOwnershipFile) uploadedFileDetails.push(await uploadFile(proofOfOwnershipFile, 'proof_of_ownership'));
          
          for (const file of supportingDocs) {
            uploadedFileDetails.push(await uploadFile(file, 'supporting_document_funds'));
          }
    
          const validUploads = uploadedFileDetails.filter(Boolean);
          if (validUploads.length > 0) {
            const documentRecords = validUploads.map(f => ({
              user_id: user.id,
              document_type: f.category === 'government_id' ? 'Government ID' : 
                             f.category === 'proof_of_ownership' ? 'Proof of Ownership' : 'Proof of Funds',
              document_url: f.url,
              document_category: f.category, 
              verification_status: 'pending_review',
              upload_date: new Date().toISOString(),
            }));
    
            const { error: docError } = await supabase.from('verification_documents').insert(documentRecords);
            if (docError) throw new Error(`Document record insertion failed: ${docError.message}`);
          }
          
          toast({ title: "Information Submitted", description: "Your verification details and documents are submitted for review." });
          await fetchInvestmentProfile(); 
          await fetchDocuments(); 
          onNext(); 
    
        } catch (error) {
          console.error("Submission error:", error);
          toast({ variant: "destructive", title: "Submission Failed", description: error.message || "An unexpected error occurred." });
        } finally {
          setIsSubmitting(false);
        }
      };
      
    
      return (
        <form onSubmit={handleSubmit} className="p-6 md:p-8 bg-card rounded-lg shadow-lg border border-border/30 space-y-8">
          <div>
            <h3 className="text-2xl font-semibold text-primary-foreground mb-1">Verification Details</h3>
            <p className="text-sm text-muted-foreground">Provide the necessary information for verification.</p>
          </div>
    
          <div className="space-y-3">
            <Label>Are you applying as an Individual or a Company?</Label>
            <div className="flex gap-4">
              <Button type="button" variant={applicantType === 'individual' ? 'default' : 'outline'} onClick={() => setApplicantType('individual')} className="flex-1">
                <User className="mr-2 h-4 w-4" /> Individual
              </Button>
              <Button type="button" variant={applicantType === 'company' ? 'default' : 'outline'} onClick={() => setApplicantType('company')} className="flex-1">
                <Building className="mr-2 h-4 w-4" /> Company
              </Button>
            </div>
          </div>
    
          <div className="space-y-4">
            <Input label="Legal Full Name" name="legalFullName" value={formData.legalFullName} onChange={handleInputChange} placeholder="As it appears on official documents" required />
            
            {applicantType === 'individual' && (
              <>
                <Input label="Residence Address" name="residenceAddress" value={formData.residenceAddress} onChange={handleInputChange} placeholder="Street, City, State, Zip, Country" required />
                <FileInput id="govIdFile" label="Government-issued ID (e.g., Passport, Driver's License)" onChange={handleGovIdFileChange} accept=".pdf,.jpg,.jpeg,.png" disabled={isSubmitting} />
                {govIdFile && <p className="text-xs text-green-500">Selected: {govIdFile.name}</p>}
              </>
            )}
    
            {applicantType === 'company' && (
              <>
                <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Registered Company Name" required />
                <Input label="Owner's Legal Full Name" name="companyOwnerName" value={formData.companyOwnerName} onChange={handleInputChange} placeholder="Full name of the primary owner" required />
                <Input label="Company Address" name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} placeholder="Registered Company Address" required />
                <Input label="EIN Number (or equivalent Tax ID)" name="companyEIN" value={formData.companyEIN} onChange={handleInputChange} placeholder="Company Tax Identification Number" required />
                <FileInput id="proofOfOwnershipFile" label="Proof of Ownership (e.g., Business Registration, Articles of Incorporation)" onChange={handleProofOfOwnershipFileChange} accept=".pdf,.jpg,.jpeg,.png" disabled={isSubmitting} />
                {proofOfOwnershipFile && <p className="text-xs text-green-500">Selected: {proofOfOwnershipFile.name}</p>}
              </>
            )}
          </div>
          
          <div className="space-y-3 p-4 border border-dashed border-primary/30 rounded-md bg-primary/5">
            <Label className="text-base">Proof of Funds & Supporting Documents</Label>
            <p className="text-xs text-muted-foreground">Upload documents verifying your declared investment capacity (e.g., bank statements, brokerage account statements). Max {MAX_SUPPORTING_DOCS} files.</p>
            <FileInput id="supportingDocs" label="Upload Supporting Documents" onChange={handleSupportingDocsChange} multiple accept=".pdf,.jpg,.jpeg,.png" disabled={isSubmitting} uploadedFilesCount={supportingDocs.length} maxFiles={MAX_SUPPORTING_DOCS} />
            {supportingDocs.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Selected files:</p>
                {supportingDocs.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-muted/50 p-1.5 rounded">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSupportingDoc(index)} className="text-destructive hover:text-destructive/80 h-auto p-0.5">Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
    
          <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
            <div className="flex items-start space-x-3">
                <ShieldAlert className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary-foreground/90">Our Privacy Commitment</h4>
                  <ul className="list-disc list-inside text-xs text-muted-foreground/80 space-y-1 mt-1">
                    <li>Documents are used <strong className="text-primary-foreground/80">only for verification</strong> by our team.</li>
                    <li>Files are <strong className="text-primary-foreground/80">automatically and permanently deleted</strong> after review (approval or denial).</li>
                    <li><strong className="text-primary-foreground/80">No third parties</strong> will ever have access to this data.</li>
                    <li>The Boogasi Investor Badge is for <strong className="text-primary-foreground/80">platform credibility only</strong> and not a legal accreditation.</li>
                  </ul>
                </div>
              </div>
          </div>
    
          <div className="flex items-center space-x-2 pt-4 border-t border-border/20">
            <Checkbox id="agreement" checked={agreementChecked} onCheckedChange={setAgreementChecked} disabled={isSubmitting} />
            <Label htmlFor="agreement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I have read and agree to the {' '}
              <Dialog open={isPolicyModalOpen} onOpenChange={setIsPolicyModalOpen}>
                <Button variant="link" type="button" className="p-0 h-auto text-sm" onClick={() => setIsPolicyModalOpen(true)}>
                  Confidentiality Policy
                </Button>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Confidentiality Policy</DialogTitle>
                    <DialogDescription>
                      Your privacy and data security are paramount to us.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto py-4">
                    <p><strong>Last Updated: {new Date("2025-06-09").toLocaleDateString()}</strong></p>
                    <p>Boogasi ("we," "us," or "our") is committed to protecting your privacy and ensuring the security of your personal and financial information. This Confidentiality Policy outlines how we handle the information you provide during the Investor Verification Process.</p>
                    <h4>1. Information We Collect</h4>
                    <p>For the Investor Verification Process, we may collect:</p>
                    <ul>
                      <li>Legal Full Name</li>
                      <li>Residential Address (for individuals)</li>
                      <li>Government-issued ID (for individuals)</li>
                      <li>Company Name, Owner's Legal Full Name, Company Address, EIN (for companies)</li>
                      <li>Proof of Company Ownership</li>
                      <li>Documents to verify investment capacity (e.g., bank statements, brokerage statements - collectively, "Verification Documents")</li>
                    </ul>
                    <h4>2. Use of Information</h4>
                    <p>The information and Verification Documents collected are used <strong className="text-primary">exclusively</strong> for:</p>
                    <ul>
                      <li>Verifying your identity and/or company details.</li>
                      <li>Verifying your declared investment capacity.</li>
                      <li>Internal review by authorized Boogasi personnel.</li>
                      <li>Complying with legal and regulatory obligations relevant to our platform's operation.</li>
                    </ul>
                    <h4>3. Data Security, Storage, and Deletion</h4>
                    <p>We implement robust security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. All uploaded Verification Documents are stored securely and encrypted during the review period.</p>
                    <p><strong>Privacy Commitment - Permanent Deletion:</strong> Crucially, all submitted Verification Documents (e.g., bank statements, IDs) are <strong className="text-destructive">automatically and permanently deleted</strong> from our active systems and storage immediately after the verification review process is completed (whether your application is approved or denied). We do not retain copies of these sensitive documents beyond this necessary review period. Basic profile information related to your verification status (e.g., verified: yes/no, verified range) will be retained as part of your user profile according to our general Privacy Policy.</p>
                    <h4>4. Information Sharing and Disclosure</h4>
                    <p>We <strong className="text-primary">do not sell, trade, or rent</strong> your personal identification information or Verification Documents to third parties. Your information will only be accessible to authorized Boogasi personnel directly involved in the verification process.</p>
                    <p>We may disclose information if required by law or in a good faith belief that such action is necessary to comply with a valid legal process, protect the rights, property, or safety of Boogasi, our users, or the public.</p>
                    <h4>5. Boogasi Investor Badge</h4>
                    <p>The "Verified Boogasi Investor" badge is a symbol of credibility <strong className="text-primary">within the Boogasi platform only</strong>. It signifies that a user has completed our internal verification process to a satisfactory level. Boogasi <strong className="text-destructive">does not issue legal accreditation or financial endorsement</strong> outside of our platform. The badge should not be interpreted as a financial or legal certification recognized by external bodies.</p>
                    <h4>6. Your Consent</h4>
                    <p>By submitting your information and documents for verification, you consent to the collection, use, and handling of your data as described in this Confidentiality Policy.</p>
                    <h4>7. Changes to This Policy</h4>
                    <p>We may update this Confidentiality Policy from time to time. We will notify you of any significant changes by posting the new policy on our platform. Your continued use of the verification service after such changes constitutes your acceptance of the new policy.</p>
                    <h4>8. Contact Us</h4>
                    <p>If you have any questions about this Confidentiality Policy, please contact us at legal@boogasi.com.</p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsPolicyModalOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              .
            </Label>
          </div>
    
          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-border/30">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting || !agreementChecked} className="w-full sm:w-auto mt-2 sm:mt-0">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit for Review'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      );
    };
    
    export default VerificationStepForm;