import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link } from "../components/Link";
import { Check, Clock, BarChart, Award, PlayCircle, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

const courseData = {
  id: 1,
  title: "أساسيات البرمجة بلغة Python",
  description: "دورة شاملة لتعلم البرمجة من الصفر باستخدام لغة Python مع تطبيقات عملية ومشاريع حقيقية. ستتعلم الأساسيات والمفاهيم المتقدمة في البرمجة.",
  price: "299 د.ل",
  image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&auto=format&fit=crop",
  instructor: "د. محمد أحمد",
  duration: "12 أسبوع",
  level: "مبتدئ",
  studentsCount: "1,234",
  rating: "4.8",
  objectives: [
    "فهم المفاهيم الأساسية في البرمجة",
    "كتابة أكواد Python نظيفة وفعالة",
    "العمل مع البيانات والملفات",
    "بناء مشاريع برمجية عملية",
    "حل المشكلات باستخدام البرمجة"
  ],
  curriculum: [
    {
      title: "الفصل الأول: مقدمة في البرمجة",
      lessons: [
        { title: "ما هي البرمجة؟", duration: "15 دقيقة", type: "video" },
        { title: "تثبيت Python وبيئة العمل", duration: "20 دقيقة", type: "video" },
        { title: "البرنامج الأول Hello World", duration: "10 دقيقة", type: "video" },
        { title: "اختبار الفصل الأول", duration: "10 دقيقة", type: "quiz" }
      ]
    },
    {
      title: "الفصل الثاني: المتغيرات وأنواع البيانات",
      lessons: [
        { title: "المتغيرات في Python", duration: "18 دقيقة", type: "video" },
        { title: "أنواع البيانات الأساسية", duration: "25 دقيقة", type: "video" },
        { title: "العمليات الحسابية", duration: "15 دقيقة", type: "video" },
        { title: "تمارين عملية", duration: "30 دقيقة", type: "practice" }
      ]
    },
    {
      title: "الفصل الثالث: الجمل الشرطية والحلقات",
      lessons: [
        { title: "جملة If وElse", duration: "20 دقيقة", type: "video" },
        { title: "حلقة For", duration: "22 دقيقة", type: "video" },
        { title: "حلقة While", duration: "18 دقيقة", type: "video" },
        { title: "مشروع عملي صغير", duration: "45 دقيقة", type: "project" }
      ]
    },
    {
      title: "الفصل الرابع: الدوال Functions",
      lessons: [
        { title: "تعريف الدوال", duration: "25 دقيقة", type: "video" },
        { title: "المعاملات والقيم المرجعة", duration: "20 دقيقة", type: "video" },
        { title: "Scope والمتغيرات", duration: "15 دقيقة", type: "video" }
      ]
    }
  ]
};

export function CourseDetailsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="mb-4">{courseData.title}</h1>
              <p className="text-lg opacity-90 mb-6">{courseData.description}</p>

              <div className="flex flex-wrap gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4" />
                  <span>المستوى: {courseData.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{courseData.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>شهادة إتمام</span>
                </div>
              </div>

              <div className="text-3xl mb-6">{courseData.price}</div>

              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                سجل في الدورة
              </Button>
            </div>

            <div className="hidden lg:block">
              <img
                src={courseData.image}
                alt={courseData.title}
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Objectives */}
            <Card className="p-6">
              <h2 className="mb-4">ماذا ستتعلم في هذه الدورة؟</h2>
              <div className="space-y-3">
                {courseData.objectives.map((objective, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <p className="text-sm">{objective}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Course Curriculum */}
            <Card className="p-6">
              <h2 className="mb-4">محتوى الدورة</h2>
              <Accordion type="single" collapsible className="w-full">
                {courseData.curriculum.map((section, sectionIndex) => (
                  <AccordionItem key={sectionIndex} value={`section-${sectionIndex}`}>
                    <AccordionTrigger className="text-right">
                      <div className="flex-1 text-right">
                        <h3>{section.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {section.lessons.length} دروس
                        </p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pr-4">
                        {section.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lessonIndex}
                            className="flex items-center justify-between py-3 border-b border-border last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              {lesson.type === "video" && <PlayCircle className="w-4 h-4 text-muted-foreground" />}
                              {lesson.type === "quiz" && <FileText className="w-4 h-4 text-muted-foreground" />}
                              {lesson.type === "practice" && <FileText className="w-4 h-4 text-muted-foreground" />}
                              {lesson.type === "project" && <FileText className="w-4 h-4 text-muted-foreground" />}
                              <span className="text-sm">{lesson.title}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            {/* Instructor */}
            <Card className="p-6">
              <h2 className="mb-4">المدرب</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">{courseData.instructor[0]}</span>
                </div>
                <div>
                  <h3>{courseData.instructor}</h3>
                  <p className="text-sm text-muted-foreground">مدرب برمجة معتمد</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-20">
              <h3 className="mb-4">معلومات الدورة</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المستوى</span>
                  <span>{courseData.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المدة</span>
                  <span>{courseData.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عدد الطلاب</span>
                  <span>{courseData.studentsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التقييم</span>
                  <span>⭐ {courseData.rating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الشهادة</span>
                  <span>متاحة</span>
                </div>
              </div>

              <div className="border-t border-border mt-6 pt-6">
                <Button className="w-full mb-3">
                  سجل في الدورة
                </Button>
                <Link href="/courses">
                  <Button variant="outline" className="w-full">
                    عودة للدورات
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
