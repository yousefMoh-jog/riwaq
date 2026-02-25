import { Link } from 'react-router-dom';
import { RiwaqHeader } from '../components/RiwaqHeader';
import { RiwaqFooter } from '../components/RiwaqFooter';
import { Play, BookOpen, Search } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { educationalLevelLabel } from '../../lib/utils';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const levels = [
    { id: 'all', label: 'جميع المستويات' },
    { id: 'preparatory', label: 'إعدادي' },
    { id: 'secondary', label: 'ثانوي' },
    { id: 'university', label: 'جامعي' },
  ];

  // Derive unique categories from loaded courses (no extra API call needed)
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

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('فشل تحميل الدورات');
    } finally {
      setLoading(false);
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

        {/* Filters Section */}
        <section className="bg-background border-b border-border py-5 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">

            {/* Row 1: Search + clear */}
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
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedLevel === level.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            {/* Row 3: Category filter (only shown when categories are available) */}
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border ${selectedCategory === cat.id
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
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                      <div
                        key={course.id}
                        className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                      >
                        <div className="relative overflow-hidden aspect-video">
                          <ImageWithFallback
                            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=300&fit=crop'}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                              <Play size={28} className="text-accent-foreground mr-1" />
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="flex-1">
                              <h3 className="text-xl mb-1">{course.title}</h3>
                              {course.category_name && (
                                <p className="text-xs text-primary mb-2">
                                  {course.category_name ?? 'غير مصنف'}
                                </p>
                              )}
                            </div>
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                              {educationalLevelLabel(course.educational_level)}
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-4 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl text-primary">{course.price} د.ل</span>
                            <Link
                              to={`/course/${course.id}`}
                              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              عرض التفاصيل
                            </Link>
                          </div>
                        </div>
                      </div>
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
