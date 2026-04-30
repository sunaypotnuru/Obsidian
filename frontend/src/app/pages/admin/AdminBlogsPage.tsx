import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { toast } from 'sonner';

interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  image_url: string;
  published: boolean;
  created_at: string;
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: 'Netra AI Team',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80',
    published: false
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // If table doesn't exist yet, this returns an array
      setBlogs(data || []);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load blogs. Please ensure the blogs table exists.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('blogs')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success("Blog updated successfully");
      } else {
        const { error } = await supabase
          .from('blogs')
          .insert([formData]);
        if (error) throw error;
        toast.success("Blog created successfully");
      }
      setIsFormOpen(false);
      setEditingId(null);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Blog deleted");
      fetchBlogs();
    } catch (err) {
      toast.error('Failed to delete blog');
    }
  };

  const handleEdit = (blog: Blog) => {
    setFormData({
      title: blog.title,
      content: blog.content,
      author: blog.author,
      image_url: blog.image_url,
      published: blog.published
    });
    setEditingId(blog.id);
    setIsFormOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Blogs</h1>
          <p className="text-gray-500 mt-1">Publish and manage articles for the public Insights page.</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ title: '', content: '', author: 'Netra AI Team', image_url: '', published: false });
          setIsFormOpen(true);
        }} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Blog
        </Button>
      </div>

      {isFormOpen && (
        <Card className="p-6 mb-8 border-t-4 border-t-teal-600 shadow-lg">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            {editingId ? 'Edit Article' : 'Draft New Article'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="The Future of AI in Healthcare" 
                />
              </div>
              <div>
                <Label>Author</Label>
                <Input 
                  required 
                  value={formData.author} 
                  onChange={e => setFormData({ ...formData, author: e.target.value })} 
                />
              </div>
            </div>
            
            <div>
              <Label>Cover Image URL (Optional)</Label>
              <div className="flex gap-2">
                 <ImageIcon className="w-10 h-10 p-2 bg-gray-100 rounded-lg text-gray-400" />
                 <Input 
                  value={formData.image_url} 
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })} 
                  placeholder="https://..." 
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Content (Markdown supported)</Label>
              <textarea 
                required
                rows={8}
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Write your insightful article here..."
              />
            </div>

            <div className="flex items-center gap-2 mt-4 p-4 bg-gray-50 rounded-lg border">
              <input 
                type="checkbox" 
                id="published"
                checked={formData.published}
                onChange={e => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
              />
              <Label htmlFor="published" className="font-semibold cursor-pointer">Publish Immediately</Label>
              <span className="text-sm text-gray-500 ml-2">(If unchecked, it saves as a Draft)</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                {loading ? 'Saving...' : (editingId ? 'Update Blog' : 'Save Blog')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && !isFormOpen ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <motion.div 
              key={blog.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {blog.image_url ? (
                <img src={blog.image_url} alt={blog.title} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-teal-200" />
                </div>
              )}
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${blog.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {blog.published ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(blog)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(blog.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{blog.title}</h3>
                <p className="text-sm text-gray-500 mb-4 font-medium">By {blog.author}</p>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{blog.content}</p>
                
                <div className="text-xs text-gray-400 pt-4 border-t">
                  Created: {new Date(blog.created_at).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}

          {blogs.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No blogs found. Create your first article!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
