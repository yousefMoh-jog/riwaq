import { useState, useEffect } from 'react';
import { RiwaqHeader } from '../components/RiwaqHeader';
import { RiwaqFooter } from '../components/RiwaqFooter';
import { Search } from 'lucide-react';
import { CourseCard } from '../components/CourseCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  thumbnail_url: string | null;
  educational_level: string;
  category_name: string;
}

export function RiwaqCoursesPage() {
  const { isAuthenticated } = useAuth();

  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedLevel, setSelectedLevel]     = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses]                 = useState<Course[]>([]);
  const [favoritedIds, setFavoritedIds]       = useState<Set<string>>(new Set());
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  const levels = [
    { id: 'all',          label: 'جميع المستويات' },
    { id: 'preparatory',  label: 'إعدادي' },
    { id: 'secondary',    label: 'ثانوي' },
    { id: 'university',   label: 'جامعي' },
  ];

  // Derive unique categories from loaded courses
  const categories = [
    { id: 'all', label: 'جميع الفئات' },
    ...Array.from(
      new Map(
        courses
          .filter((c) => c.category_name)
          .map((c) => [c.category_name, { id: c.category_name, label: c.category_name }])
      ).values()
    ),
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch favorite IDs once the user is authenticated so we can pre-fill hearts
  useEffect(() => {
    if (!isAuthenticated) { setFavoritedIds(new Set()); return; }
    fetchFavoriteIds();
  }, [isAuthenticated]);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.courses || []);
    } catch {
      setError('فشل تحميل الدورات');
    } finally {
      setLoading(false);
    }
  };

  const fetchFavoriteIds = async () => {
    try {
      const { data } = await api.get('/favorites');
      const ids = (data.favorites as { id: string }[]).map((f) => f.id);
      setFavoritedIds(new Set(ids));
    } catch {
      // Non-critical — hearts simply start un-filled
    }
  };

  const hasActiveFilters = searchTerm !== '' || selectedLevel !== 'all' || selectedCategory !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedLevel('all');
    setSelectedCategory('all');
  };

  const filteredCourses = courses.filter((course) => {
    const matchesLevel    = selectedLevel === 'all' || course.educational_level === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || course.category_name === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchesSearch   = !q ||
      course.title.toLowerCase().includes(q) ||
      course.description.toLowerCase().includes(q) ||
      (course.category_name ?? '').toLowerCase().includes(q);
    return matchesLevel && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <RiwaqHeader currentPage="courses" />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl mb-4 text-center">مكتبة الدورات التعليمية</h1>
            <p className="text-lg text-primary-foreground/90 text-center max-w-2xl mx-auto">
              اختر من بين مجموعة واسعة من الدورات التعليمية المتخصصة في مختلف المجالات
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-background border-b border-border py-5 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            {/* Row 1: Search */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  placeholder="ابحث باسم الدورة أو الفئة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 bg-input-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="whitespace-nowrap text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2.5 transition-colors"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>

            {/* Row 2: Level filter */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedLevel === level.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            {/* Row 3: Category filter */}
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border ${
                      selectedCategory === cat.id
                        ? 'bg-secondary text-secondary-foreground border-secondary'
                        : 'bg-transparent text-muted-foreground border-border hover:bg-muted/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Courses Grid */}
        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="mt-4 text-muted-foreground">جاري تحميل الدورات...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-xl text-red-600">{error}</p>
                <button
                  onClick={fetchCourses}
                  className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 text-muted-foreground">
                  عرض {filteredCourses.length} من {courses.length} دورة
                </div>

                {filteredCourses.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-xl text-muted-foreground">
                      {courses.length === 0 ? 'لا توجد دورات حالياً' : 'لا توجد دورات مطابقة لبحثك'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        id={course.id}
                        title={course.title}
                        description={course.description}
                        price={course.price}
                        thumbnail_url={course.thumbnail_url}
                        educational_level={course.educational_level}
                        category_name={course.category_name}
                        showFavorite={isAuthenticated}
                        isFavorited={favoritedIds.has(course.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <RiwaqFooter />
    </div>
  );
}
