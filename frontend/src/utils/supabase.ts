// Utility function to get the full Supabase storage URL
export const getSupabaseImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '/placeholder-image.jpeg';
  }

  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Get Supabase URL from environment
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

  if (!supabaseUrl) {
    console.warn('REACT_APP_SUPABASE_URL not found, using placeholder image');
    return '/placeholder-image.jpeg';
  }

  // Construct the full storage URL
  return `${supabaseUrl}/storage/v1/object/public/${imagePath}`;
};