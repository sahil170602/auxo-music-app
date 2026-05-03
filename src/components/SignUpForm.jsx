// src/components/SignUpForm.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SignUpForm({ onToggleMode }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  
  // Image Upload State
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user.id;
      let uploadedAvatarUrl = null;

      // 2. If a profile picture was selected, upload it
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        uploadedAvatarUrl = publicUrlData.publicUrl;
      }

      // 3. Save profile info
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            full_name: fullName,
            email: email,
            mobile_number: mobile || null,
            gender: gender,
            age: age ? parseInt(age) : null,
            avatar_url: uploadedAvatarUrl,
          }
        ]);

      if (profileError) throw profileError;

      // Clear the form
      setFullName(''); setEmail(''); setPassword('');
      setMobile(''); setGender(''); setAge('');
      setAvatarFile(null); setPreviewUrl(null);

      // Trigger the redirect to Login AND pass the popup message!
      onToggleMode('Account created successfully!');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in pb-4">
      
      {/* Premium Gradient Typography */}
      <h1 className="text-[32px] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-1 text-center">
        Join AUXO
      </h1>
      <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

      {/* Status Messages */}
      {error && (
        <div className="w-full p-3 mb-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm text-center backdrop-blur-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="w-full p-3 mb-4 rounded-xl bg-green-900/30 border border-green-500/30 text-green-300 text-sm text-center backdrop-blur-sm">
          {success}
        </div>
      )}

      <form className="w-full space-y-4" onSubmit={handleSignUp}>
        
        {/* Profile Picture Uploader */}
        <div className="flex flex-col items-center justify-center mb-4">
          <label htmlFor="avatarUpload" className="relative cursor-pointer group">
            <div className="w-24 h-24 rounded-full bg-black/50 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-fuchsia-500/50">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-neutral-500 group-hover:text-fuchsia-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold text-white">Upload</span>
            </div>
          </label>
          <input type="file" id="avatarUpload" accept="image/*" onChange={handleImageChange} className="hidden" />
        </div>

        {/* Form Inputs (AMOLED Styled) */}
        <div>
          <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required
            className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 transition-all shadow-inner" />
        </div>
        
        <div>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 transition-all shadow-inner" />
        </div>

        <div>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 transition-all shadow-inner" />
        </div>

        <div>
          <input type="tel" placeholder="Mobile Number (Optional)" value={mobile} onChange={(e) => setMobile(e.target.value)}
            className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 transition-all shadow-inner" />
        </div>

        <div className="flex gap-4">
          <select value={gender} onChange={(e) => setGender(e.target.value)} required
            className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/5 text-neutral-400 focus:text-white focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 transition-all shadow-inner appearance-none">
            <option value="" disabled>Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required min="1" max="120"
            className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/5 text-white placeholder:text-neutral-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 transition-all shadow-inner" />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {loading ? (
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="mt-4 pt-2 text-center text-neutral-400 text-sm">
          Already have an account?{' '}
          <button type="button" onClick={onToggleMode} className="text-fuchsia-500 font-bold hover:text-fuchsia-400 transition-colors">
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}