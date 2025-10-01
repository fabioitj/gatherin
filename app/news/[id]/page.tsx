import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ExternalLink, ArrowLeft, Tag, Building } from "lucide-react";
import { NewsDAL } from "@/dal/news";
import { FavoritesDAL } from "@/dal/favorites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagList } from "@/components/TagList";
import { FavoriteButton } from "@/components/FavoriteButton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Category } from "@prisma/client";

interface NewsDetailPageProps {
  params: {
    id: string;
  };
}

const categoryLabels = {
  [Category.ACOES]: "Ações",
  [Category.FII]: "FIIs",
};

const categoryColors = {
  [Category.ACOES]: "bg-purple-100 text-purple-800",
  [Category.FII]: "bg-indigo-100 text-indigo-800",
};

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const news = await NewsDAL.getNewsById(params.id);

  if (!news) {
    notFound();
  }

  // Check if the news is favorited by the current user
  const session = await getServerSession(authOptions);
  let isFavorited = false;

  if (session?.user?.id) {
    try {
      isFavorited = await FavoritesDAL.isFavorited(session.user.id, news.id);
    } catch (error) {
      console.error("Error checking favorite status:", error);
      // Continue with isFavorited = false
    }
  }

  const formattedDate = format(
    new Date(news.publishedAt),
    "dd 'de' MMMM 'de' yyyy",
    {
      locale: ptBR,
    }
  );

  const formattedTime = format(new Date(news.publishedAt), "HH:mm", {
    locale: ptBR,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/news">
          <Button
            variant="ghost"
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para início
          </Button>
        </Link>
      </div>

      <article className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <Badge
              variant="secondary"
              className={`${
                categoryColors[news.category]
              } font-medium px-4 py-2 text-base`}
            >
              {categoryLabels[news.category]}
            </Badge>

            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>
                {formattedDate} às {formattedTime}
              </span>
            </div>

            <div className="ml-auto">
              <FavoriteButton
                newsId={news.id}
                initialIsFavorited={isFavorited}
                size="lg"
                variant="outline"
                showText={true}
              />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
            {news.title}
          </h1>

          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ExternalLink className="w-4 h-4 mr-2" />
              <span>Fonte: {news.source}</span>
            </div>

            {news.sourceUrl && (
              <a
                href={news.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
              >
                Ver fonte original
              </a>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {news.imageUrl && (
          <div className="relative w-full h-64 md:h-96 mb-8 rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={news.imageUrl}
              alt={news.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        {/* Summary */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-8 rounded-r-lg">
          <h2 className="text-lg font-semibold text-purple-900 mb-3">Resumo</h2>
          <p className="text-purple-800 leading-relaxed text-lg">
            {news.summary}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-8">
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: news.content.replace(/\n/g, "<br>"),
            }}
          />
        </div>

        {/* Tags and Tickers */}
        <div className="border-t pt-8">
          <TagList tags={news.tags} tickers={news.tickers} className="mb-8" />
        </div>

        {/* Article Footer */}
        <footer className="bg-gray-50 rounded-2xl p-6 border-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Publicado em {formattedDate}</p>
              <p>Fonte: {news.source}</p>
            </div>

            <div className="flex gap-3 w-full flex-col md:flex-row">
              <FavoriteButton
                newsId={news.id}
                initialIsFavorited={isFavorited}
                variant="outline"
                showText={true}
              />

              <div className="flex gap-3 justify-between">
                <Link href="/news">
                  <Button variant="outline" className="bg-white">
                    Ver mais notícias
                  </Button>
                </Link>

                {news.sourceUrl && (
                  <a
                    href={news.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Fonte original
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
