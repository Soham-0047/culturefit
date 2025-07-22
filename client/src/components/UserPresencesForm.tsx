import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Palette, Music, BookOpen, Camera, Brush, MapPin, Sparkles, Heart, Zap } from 'lucide-react';

interface UserPreferencesFormProps {
  onComplete: () => void;
  isEditing?: boolean; // New prop to indicate if we're editing existing preferences
}

type Category = 'film' | 'music' | 'literature' | 'art' | 'design';
type MoodPreference = 'energetic' | 'calm' | 'adventurous' | 'romantic' | 'mysterious' | 'uplifting' | 'nostalgic' | 'experimental';

const CATEGORIES: { value: Category; label: string; icon: any; description: string }[] = [
  { value: 'film', label: 'Film & Cinema', icon: Camera, description: 'Movies, documentaries, and visual storytelling' },
  { value: 'music', label: 'Music', icon: Music, description: 'All genres and musical experiences' },
  { value: 'literature', label: 'Literature', icon: BookOpen, description: 'Books, poetry, and written works' },
  { value: 'art', label: 'Visual Arts', icon: Palette, description: 'Paintings, photography, and visual expression' },
  { value: 'design', label: 'Design', icon: Brush, description: 'Creative design and aesthetic innovation' }
];

const GENRE_OPTIONS: { [key in Category]: string[] } = {
  'film': ['Action', 'Thriller', 'Comedy', 'Drama', 'Documentary', 'Horror', 'Romance', 'Sci-Fi', 'Animation', 'Independent'],
  'music': ['Jazz', 'Classical', 'Electronic', 'Rock', 'Pop', 'Hip-Hop', 'Folk', 'World', 'Blues', 'Reggae'],
  'literature': ['Fiction', 'Non-fiction', 'Poetry', 'Philosophy', 'Biography', 'Mystery', 'Romance', 'Science Fiction', 'History', 'Self-Help'],
  'art': ['Photography', 'Painting', 'Sculpture', 'Digital Art', 'Street Art', 'Abstract', 'Contemporary', 'Classical', 'Minimalist', 'Pop Art'],
  'design': ['UI/UX', 'Graphic Design', 'Industrial Design', 'Architecture', 'Fashion', 'Interior Design', 'Product Design', 'Web Design', 'Brand Design', 'Typography']
};

const MOOD_PREFERENCES: { value: MoodPreference; label: string; icon: any }[] = [
  { value: 'energetic', label: 'Energetic', icon: Zap },
  { value: 'calm', label: 'Calm', icon: Heart },
  { value: 'adventurous', label: 'Adventurous', icon: Sparkles },
  { value: 'romantic', label: 'Romantic', icon: Heart },
  { value: 'mysterious', label: 'Mysterious', icon: Sparkles },
  { value: 'uplifting', label: 'Uplifting', icon: Zap },
  { value: 'nostalgic', label: 'Nostalgic', icon: Heart },
  { value: 'experimental', label: 'Experimental', icon: Sparkles }
];

const UserPreferencesForm: React.FC<UserPreferencesFormProps> = ({ onComplete, isEditing = false }) => {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [culturalTags, setCulturalTags] = useState<string>('');
  const [selectedMoods, setSelectedMoods] = useState<MoodPreference[]>([]);
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch existing preferences if editing
  useEffect(() => {
    if (isEditing) {
      fetchUserPreferences();
    }
  }, [isEditing]);

  const fetchUserPreferences = async () => {
    setIsLoadingData(true);
    setError('');
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_APP_BACKEND_URL}/auth/preferences`, {
        withCredentials: true
      });

      const preferences = response.data;
      
      // Prefill form with existing data
      setSelectedCategories(preferences.categories || []);
      setSelectedGenres(preferences.favoriteGenres || []);
      setCulturalTags(preferences.culturalTags ? preferences.culturalTags.join(', ') : '');
      setSelectedMoods(preferences.moodPreferences || []);
      setCountry(preferences.location?.country || '');
      setCity(preferences.location?.city || '');
      
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      // If preferences don't exist yet (404), that's okay for new users
      if (err.response?.status !== 404) {
        setError('Failed to load existing preferences. You can still update your settings.');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCategoryChange = (category: Category, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category));
      // Remove genres for unchecked category
      const categoryGenres = GENRE_OPTIONS[category];
      setSelectedGenres(prev => prev.filter(genre => !categoryGenres.includes(genre)));
    }
  };

  const handleGenreChange = (genre: string, checked: boolean) => {
    if (checked) {
      setSelectedGenres(prev => [...prev, genre]);
    } else {
      setSelectedGenres(prev => prev.filter(g => g !== genre));
    }
  };

  const handleMoodChange = (mood: MoodPreference, checked: boolean) => {
    if (checked) {
      setSelectedMoods(prev => [...prev, mood]);
    } else {
      setSelectedMoods(prev => prev.filter(m => m !== mood));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Parse cultural tags
      const tagsArray = culturalTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const formData = {
        preferences: {
          categories: selectedCategories,
          favoriteGenres: selectedGenres,
          culturalTags: tagsArray,
          moodPreferences: selectedMoods,
          location: {
            country: country.trim() || null,
            city: city.trim() || null,
            timezone: null
          }
        }
      };

      // Use POST for new preferences or PUT for updating existing ones
      const method = isEditing ? 'put' : 'post';
      const url = `${import.meta.env.VITE_APP_BACKEND_URL}/auth/preferences`;
      
      let response;
      if (isEditing) {
        // For PUT, send the data directly (not wrapped in preferences object)
        const updateData = {
          categories: selectedCategories,
          favoriteGenres: selectedGenres,
          culturalTags: tagsArray,
          moodPreferences: selectedMoods,
          location: {
            country: country.trim() || null,
            city: city.trim() || null,
            timezone: null
          }
        };
        response = await axios.put(url, updateData, { withCredentials: true });
      } else {
        response = await axios.post(url, formData, { withCredentials: true });
      }

      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'save'} preferences. Please try again.`);
      console.error('Error saving preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get genres for selected categories
  const availableGenres = selectedCategories.reduce((acc, category) => {
    return [...acc, ...GENRE_OPTIONS[category]];
  }, [] as string[]);

  const isSubmitDisabled = selectedCategories.length === 0 || isLoading || isLoadingData;

  // Show loading spinner while fetching existing data
  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
        <Card className="w-full max-w-4xl bg-glass backdrop-blur-glass border-glass shadow-elegant">
          <CardContent className="flex items-center justify-center py-20">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-lg text-muted-foreground">Loading your preferences...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
      <Card className="w-full max-w-4xl bg-glass backdrop-blur-glass border-glass shadow-elegant animate-fade-in">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow animate-scale-in">
            <Palette className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {isEditing ? 'Update Your Preferences' : 'Welcome to CultureSense'}
            </CardTitle>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              {isEditing 
                ? 'Modify your cultural preferences to get better personalized recommendations'
                : "Let's personalize your cultural journey by understanding your interests and preferences"
              }
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Categories Section */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-foreground">
                  What cultural areas interest you?
                </h3>
                <p className="text-muted-foreground">Select all that apply to get started</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map(({ value, label, icon: Icon, description }) => {
                  const isSelected = selectedCategories.includes(value);
                  return (
                    <div key={value} className="group">
                      <div 
                        className={`relative p-6 rounded-xl border-2 transition-all duration-smooth cursor-pointer hover-scale ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-glow'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
                        }`}
                        onClick={() => handleCategoryChange(value, !isSelected)}
                      >
                        <div className="flex flex-col items-center space-y-3 text-center">
                          <div className={`p-3 rounded-full transition-colors ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">
                              {label}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-tight">
                              {description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Favorite Genres Section */}
            {selectedCategories.length > 0 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">
                    Choose your favorite genres
                  </h3>
                  <p className="text-muted-foreground">Select specific genres that resonate with you</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableGenres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-smooth hover-scale text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/30'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGenres(prev => prev.filter(g => g !== genre));
                          } else {
                            setSelectedGenres(prev => [...prev, genre]);
                          }
                        }}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-primary border-primary' 
                            : 'border-border bg-background'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium flex-1">
                          {genre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cultural Tags Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cultural-tags" className="text-lg font-semibold">
                  Cultural Tags
                  <span className="text-muted-foreground font-normal text-sm ml-2">(Optional)</span>
                </Label>
                <p className="text-muted-foreground text-sm">
                  Add comma-separated tags that describe your cultural interests
                </p>
              </div>
              <Input
                id="cultural-tags"
                type="text"
                placeholder="e.g., minimalist, avant-garde, traditional, contemporary..."
                value={culturalTags}
                onChange={(e) => setCulturalTags(e.target.value)}
                className="w-full h-12 text-base"
              />
            </div>

            {/* Mood Preferences */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-foreground">
                  What moods resonate with you?
                </h3>
                <p className="text-muted-foreground">Select the emotional tones you gravitate towards</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MOOD_PREFERENCES.map(({ value, label, icon: Icon }) => {
                  const isSelected = selectedMoods.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-smooth hover-scale text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMoods(prev => prev.filter(m => m !== value));
                        } else {
                          setSelectedMoods(prev => [...prev, value]);
                        }
                      }}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'border-border bg-background'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 flex-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">
                          {label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-foreground flex items-center justify-center gap-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  Location
                  <span className="text-muted-foreground font-normal text-base">(Optional)</span>
                </h3>
                <p className="text-muted-foreground">Help us find cultural events and venues near you</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="country" className="text-base font-medium">
                    Country
                  </Label>
                  <Input
                    id="country"
                    type="text"
                    placeholder="e.g., United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="city" className="text-base font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="e.g., New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-center p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in">
                <p className="text-destructive text-sm font-medium" role="alert">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="text-center pt-6">
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full md:w-auto px-12 py-4 bg-gradient-primary hover:opacity-90 transition-all duration-smooth hover:shadow-elegant hover:-translate-y-1 font-semibold text-lg"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    {isEditing ? 'Updating preferences...' : 'Setting up your profile...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-3 h-5 w-5" />
                    {isEditing ? 'Update Preferences' : 'Complete Setup'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPreferencesForm;