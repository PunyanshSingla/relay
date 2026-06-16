import type { Priority, Category } from "@/types/email";

export interface HeuristicResult {
  matched: boolean;
  priority: Priority;
  category: Category;
  reason: string;
}
