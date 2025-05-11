-- Enable the pgvector extension
create extension if not exists vector;

-- Create the match_menu_items function
create or replace function match_menu_items(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  description text,
  price numeric,
  image_url text,
  food_info text,
  origin text,
  pairing_suggestion text,
  chef_notes text,
  is_recommended boolean,
  profit_margin numeric,
  category_ids uuid[],
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    mi.id,
    mi.name,
    mi.description,
    mi.price,
    mi.image_url,
    mi.food_info,
    mi.origin,
    mi.pairing_suggestion,
    mi.chef_notes,
    mi.is_recommended,
    mi.profit_margin,
    mi.category_ids,
    (mie.embedding <=> query_embedding) as similarity
  from menu_items mi
  join menu_item_embeddings mie on mi.id = mie.item_id
  where (mie.embedding <=> query_embedding) < (1 - match_threshold)
  order by (mie.embedding <=> query_embedding) asc
  limit match_count;
end;
$$; 