
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Book } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Loading from '@/components/ui/loading';

export interface RelatedPractice {
  id: string;
  job_title: string;
  company_name: string | null;
  created_at: string;
  status: string | null;
}

interface RelatedPracticesListProps {
  practices: RelatedPractice[] | null;
  isLoading: boolean;
  behavioralId: string;
}

const RelatedPracticesList: React.FC<RelatedPracticesListProps> = ({
  practices,
  isLoading,
  behavioralId
}) => {
  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Book className="h-4 w-4" />
          Follow up Question Vault Practices
        </h3>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-md bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!practices || practices.length === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Book className="h-4 w-4" />
          📘 Saved Follow-Up Practice
        </h3>
        <div className="text-sm text-gray-600">
          You haven't saved any questions to your vault yet.{' '}
          <a href="#questions" className="text-blue-600 hover:underline">
            Start by selecting questions above.
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Book className="h-4 w-4" />
        Follow up Question Vault Practices
      </h3>
      <div className="space-y-2">
        {practices.map((practice) => (
          <Link 
            to={`/questions?id=${practice.id}`} 
            key={practice.id}
            className="block"
          >
            <Card className="hover:shadow-sm transition-all border-gray-200 hover:border-gray-300">
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium truncate">
                    {practice.job_title}
                  </p>
                  {practice.company_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {practice.company_name}
                    </p>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    practice.status === 'completed' 
                      ? "border-green-300 text-green-700" 
                      : "border-amber-300 text-amber-700"
                  }
                >
                  {practice.status === 'completed' ? 'completed' : 'in progress'}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedPracticesList;
