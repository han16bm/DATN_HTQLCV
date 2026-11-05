import { ReviewsPage } from "@/features/submissions/components/reviews-page";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense>
      <ReviewsPage />
    </Suspense>
  );
}
