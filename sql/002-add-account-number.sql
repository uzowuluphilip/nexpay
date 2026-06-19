-- Migration: Add account_number field to profiles table
-- Run this in Supabase SQL Editor to add the account_number column

ALTER TABLE profiles ADD COLUMN account_number TEXT UNIQUE;

-- Create an index for faster lookups
CREATE INDEX idx_profiles_account_number ON profiles(account_number);
