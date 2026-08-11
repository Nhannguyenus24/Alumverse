ALTER TABLE public.fund_donations
    ADD COLUMN IF NOT EXISTS sepay_transaction_id bigint;

CREATE UNIQUE INDEX IF NOT EXISTS uk_fund_donations_sepay_transaction_id
    ON public.fund_donations(sepay_transaction_id);
