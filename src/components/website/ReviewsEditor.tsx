import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateReview } from "@/components/templates/LocalBusinessTemplate";

export const reviewsQueryKey = (businessId: string) => ["business-reviews", businessId] as const;

export function useBusinessReviews(businessId: string | undefined) {
  return useQuery({
    queryKey: reviewsQueryKey(businessId ?? "none"),
    enabled: Boolean(businessId),
    queryFn: async (): Promise<TemplateReview[]> => {
      const { data, error } = await supabase
        .from("business_reviews")
        .select("id, author_name, location, rating, quote, source")
        .eq("business_id", businessId!)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as TemplateReview[];
    },
  });
}

/**
 * Customer-facing reviews manager plus the Google Business Profile link.
 *
 * Reviews are business data, so they live in their own table — the design just
 * renders whatever is here.
 */
export function ReviewsEditor({
  businessId,
  googleUrl,
  onGoogleUrlChange,
}: {
  businessId: string;
  googleUrl: string;
  onGoogleUrlChange: (value: string) => void;
}) {
  const queryClient = useQueryClient();
  const reviews = useBusinessReviews(businessId);
  const [draft, setDraft] = useState({ author_name: "", location: "", quote: "", rating: 5 });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: reviewsQueryKey(businessId) });

  const add = useMutation({
    mutationFn: async () => {
      if (draft.author_name.trim().length < 2 || draft.quote.trim().length < 5) {
        throw new Error("Add a name and what they said.");
      }
      const { error } = await supabase.from("business_reviews").insert({
        business_id: businessId,
        author_name: draft.author_name.trim().slice(0, 80),
        location: draft.location.trim().slice(0, 80) || null,
        quote: draft.quote.trim().slice(0, 600),
        rating: draft.rating,
        source: googleUrl ? "google" : "manual",
        sort_order: reviews.data?.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ author_name: "", location: "", quote: "", rating: 5 });
      void invalidate();
      toast.success("Review added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add that review"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("business_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidate(),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-semibold">Your Google Business Profile</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste the link customers use to see your reviews on Google. We add a "See all our Google
          reviews" link on your website, and you can copy your best reviews in below.
        </p>
        <Input
          className="mt-3"
          placeholder="https://g.page/your-business or your Google Maps link"
          value={googleUrl}
          onChange={(e) => onGoogleUrlChange(e.target.value)}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Pulling reviews in automatically needs Google's approval for our account — we've applied.
          Until it's granted, adding them here takes a minute and looks exactly the same.
        </p>
      </div>

      {reviews.data && reviews.data.length > 0 ? (
        <ul className="space-y-2">
          {reviews.data.map((review) => (
            <li
              key={review.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {review.author_name}
                  {review.location ? (
                    <span className="text-muted-foreground"> · {review.location}</span>
                  ) : null}
                </p>
                <p className="mt-0.5 flex items-center gap-0.5 text-xs text-amber-500">
                  {Array.from({ length: review.rating ?? 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </p>
                <p className="mt-1 text-muted-foreground">{review.quote}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove review"
                onClick={() => remove.mutate(review.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          No reviews yet. Sites with three or four real reviews get noticeably more enquiries.
        </p>
      )}

      <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Customer name</Label>
            <Input
              value={draft.author_name}
              maxLength={80}
              onChange={(e) => setDraft((d) => ({ ...d, author_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Town (optional)</Label>
            <Input
              value={draft.location}
              maxLength={80}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>What they said</Label>
          <Textarea
            rows={3}
            maxLength={600}
            value={draft.quote}
            onChange={(e) => setDraft((d) => ({ ...d, quote: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Stars</Label>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} stars`}
              onClick={() => setDraft((d) => ({ ...d, rating: n }))}
              className={n <= draft.rating ? "text-amber-500" : "text-muted-foreground/40"}
            >
              <Star className="h-4 w-4 fill-current" />
            </button>
          ))}
          <Button
            size="sm"
            className="ml-auto"
            disabled={add.isPending}
            onClick={() => add.mutate()}
          >
            <Plus className="mr-1 h-4 w-4" /> Add review
          </Button>
        </div>
      </div>
    </div>
  );
}
