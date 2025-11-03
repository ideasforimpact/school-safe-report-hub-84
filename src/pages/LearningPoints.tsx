import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { fetchLearningPoints, LearningPointRecord } from '@/services/learningPointsService';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const LearningPointsPage: React.FC = () => {
  const { state } = useEmployeeStore();
  const clientId = state.employeeData?.clientId || '';
  const navigate = useNavigate();

  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('');
  const [subcategory, setSubcategory] = React.useState<string>('');
  const [pageSize, setPageSize] = React.useState<number>(10);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<LearningPointRecord[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const [categories, setCategories] = React.useState<string[]>([]);
  const [subcategories, setSubcategories] = React.useState<string[]>([]);

  const loadData = React.useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const res = await fetchLearningPoints(clientId, currentPage, pageSize, {
      search,
      category,
      subcategory
    });
    setData(res.data);
    setTotalCount(res.totalCount);
    setCategories(res.categories);
    setSubcategories(res.subcategories);
    setLoading(false);
  }, [clientId, currentPage, pageSize, search, category, subcategory]);

  React.useEffect(() => {
    setCurrentPage(1); // reset page when filters change
  }, [search, category, subcategory, pageSize]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const truncate = (value: string, limit: number) => {
    if (!value) return '';
    return value.length > limit ? value.slice(0, limit) + '...' : value;
  };

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="text-left">
              <h1 className="text-2xl font-bold">Learning Points</h1>
              <p className="text-gray-600 mt-1">Review and search learning points captured from incidents</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium mb-1">Search</label>
                <Input
                  placeholder="Search by Incident ID, Category, Subcategory, or Learning Points"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select value={category || 'all'} onValueChange={(v) => { const val = v === 'all' ? '' : v; setCategory(val); setSubcategory(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium mb-1">Sub Category</label>
                <Select value={subcategory || 'all'} onValueChange={(v) => setSubcategory(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {subcategories.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-32">
                <label className="block text-sm font-medium mb-1">Show</label>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Incident Id</TableHead>
                    <TableHead className="w-[28%]">Category</TableHead>
                    <TableHead className="w-[40%]">Learning Points</TableHead>
                    <TableHead className="w-48">Created By</TableHead>
                    <TableHead className="w-40">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading...</TableCell>
                    </TableRow>
                  )}
                  {!loading && data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">No records found</TableCell>
                    </TableRow>
                  )}
                  {!loading && data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">{row.incidentId}</TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-[28rem]">
                          <span className="font-medium truncate" title={row.category}>
                            {truncate(row.category, 60)}
                          </span>
                          {row.subcategory && (
                            <span className="text-xs text-gray-500 truncate" title={row.subcategory}>
                              {truncate(row.subcategory, 60)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[44rem] whitespace-pre-wrap">
                          <span title={row.learningPoints}>{truncate(row.learningPoints, 160)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span title={row.createdBy}>{truncate(row.createdBy, 10)}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span title={new Date(row.createdAt).toLocaleDateString()}>
                          {truncate(new Date(row.createdAt).toLocaleDateString(), 10)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.max(1, p - 1)); }} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).slice(0, 5).map((_, idx) => {
                    const page = idx + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}>
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage((p) => Math.min(totalPages, p + 1)); }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LearningPointsPage;


