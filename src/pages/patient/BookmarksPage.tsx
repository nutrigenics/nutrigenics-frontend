import { useState, useEffect } from 'react';
import { RecipeTable } from '@/components/recipe/RecipeTable';
import { Bookmark, Heart, BookOpen } from 'lucide-react';
import { recipeService } from '@/services/recipe.service';
import type { Recipe } from '@/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BookmarksPage() {
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const [bookmarked, liked] = await Promise.all([
        recipeService.getBookmarkedRecipes(),
        recipeService.getLikedRecipes()
      ]);
      setBookmarkedRecipes(bookmarked);
      setLikedRecipes(liked);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async (recipeId: number) => {
    try {
      await recipeService.bookmarkRecipe(recipeId);
      // Optimistic update or refresh? Refresh for now to be safe with lists
      fetchAll();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleLike = async (recipeId: number) => {
    try {
      await recipeService.likeRecipe(recipeId);
      fetchAll();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="w-full p-8 bg-muted rounded-[2rem]">
          <div className="h-8 bg-muted-foreground/20 rounded w-1/4 mb-4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full relative overflow-hidden mb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="p-1.5 bg-muted rounded-lg">
            <BookOpen className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-muted-foreground text-xs font-bold uppercase tracking-wide">Library</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight"
        >
          Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">Collection</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-lg"
        >
          Access your saved recipes and favorites in one place.
        </motion.p>
      </div>

      <div className="w-full">
        <Tabs defaultValue="bookmarks" className="w-full ">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="h-16 bg-white rounded-full border px-3">
              <TabsTrigger value="bookmarks" className="w-full rounded-full px-6 h-10 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Bookmark className="w-4 h-4 mr-2" />
                Saved
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {bookmarkedRecipes.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="likes" className="w-full rounded-full px-6 h-10 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Heart className="w-4 h-4 mr-2" />
                Liked
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {likedRecipes.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="bookmarks" className="mt-0">
            {bookmarkedRecipes.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <RecipeTable
                  recipes={bookmarkedRecipes}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                />
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-border">
                <div className="w-16 h-16 bg-card rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                  <Bookmark className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No saved recipes</h3>
                <p className="text-muted-foreground mb-6">Start browsing to build your cookbook!</p>
                <Link to="/recipes">
                  <Button>Browse Recipes</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            {likedRecipes.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <RecipeTable
                  recipes={likedRecipes}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                />
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-border">
                <div className="w-16 h-16 bg-card rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No liked recipes</h3>
                <p className="text-muted-foreground mb-6">Like recipes to see them here!</p>
                <Link to="/recipes">
                  <Button>Browse Recipes</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
