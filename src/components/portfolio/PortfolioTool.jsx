import React from "react";
import { Button } from "@/components/ui/button";

const PortfolioTool = ({ icon, title, onClick }) => {
  return (
    <Button
      variant="outline"
      className="w-full justify-start space-x-2"
      onClick={onClick}
    >
      {icon}
      <span>{title}</span>
    </Button>
  );
};

export default PortfolioTool;
