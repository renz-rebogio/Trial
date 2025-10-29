import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;

const FileDataInput = ({
  selectedFiles,
  handleFileChange,
  removeFile,
  manualTransactions,
  setManualTransactions,
  acceptedFileTypes,
}) => {
  return (
    <Card className="glassmorphic shadow-xl border-[hsl(var(--brighter-teal))]/30 bg-[hsl(var(--card-bg-bright-teal-tint))]">
      <CardHeader>
        <CardTitle className="text-2xl text-primary-foreground">
          Input Your Financial Data
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload up to {MAX_FILES} files (CSV, PDF, PNG, JPG) or paste
          transaction data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label
            htmlFor="transactions-file-input"
            className="text-lg font-medium text-primary-foreground"
          >
            Upload Files (Max {MAX_FILES})
          </Label>
          <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-muted-foreground/50 hover:border-[hsl(var(--boogasi-green-val))] transition-colors">
            <div className="space-y-1 text-center">
              <UploadCloud
                className={cn(
                  "mx-auto h-12 w-12 text-muted-foreground icon-neon-green file-upload-icon"
                )}
              />
              <div className="flex text-sm text-muted-foreground">
                <label
                  htmlFor="transactions-file-input"
                  className="relative cursor-pointer rounded-md font-medium text-[hsl(var(--boogasi-blue-val))] hover:text-[hsl(var(--boogasi-blue-val))]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                >
                  <span>Select files</span>
                  <Input
                    id="transactions-file-input"
                    name="transactions-file-input"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept={acceptedFileTypes}
                    multiple
                    disabled={selectedFiles.length >= MAX_FILES}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-muted-foreground">
                CSV, PDF, PNG, JPG up to 5MB each
              </p>
            </div>
          </div>
          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-primary-foreground">
                Selected Files ({selectedFiles.length}/{MAX_FILES}):
              </p>
              <ul className="max-h-40 overflow-y-auto space-y-1 rounded-md border border-border p-2 bg-input/50">
                {selectedFiles.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between text-sm text-muted-foreground p-1.5 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center truncate">
                      <FileText
                        className={cn(
                          "h-4 w-4 mr-2 flex-shrink-0 icon-neon-green selected-file-icon"
                        )}
                      />
                      <span className="truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <XCircle className="h-4 w-4 text-[hsl(var(--boogasi-pink-val))]" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div>
          <Label
            htmlFor="manual-transactions"
            className="text-lg font-medium text-primary-foreground"
          >
            Manual Transaction Input (CSV Format)
          </Label>
          <Textarea
            id="manual-transactions"
            placeholder="Paste transactions here (e.g., Date,Description,Category,Amount)..."
            className="mt-2 min-h-[150px] bg-input text-foreground placeholder:text-muted-foreground border-border focus:border-[hsl(var(--brighter-teal))] focus:ring-[hsl(var(--brighter-teal))]"
            value={manualTransactions}
            onChange={(e) => setManualTransactions(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: Date, Description, Category, Amount (one transaction per
            line).
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileDataInput;
