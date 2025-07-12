import { Suspense } from "react";
import QRCodeGeneration from "./QRCodeGeneration";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QRCodeGeneration />
    </Suspense>
  );
}