import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileScreen({ onBack }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('main'); 
  const [message, setMessage] = useState({ text: '', type: '' });
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '', email: '', gender: '', age: '', avatar_url: ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '', new: '', confirm: ''
  });

  // 🔴 1. PLAYER VISIBILITY FIX
  useEffect(() => {
    fetchProfile();
    
    // Hide the player when Profile Screen opens
    const player = document.getElementById('auxo-player');
    if (player) player.style.display = 'none';

    // Show the player again when leaving the Profile Screen
    return () => {
      if (player) player.style.display = 'block';
    };
  }, []);

  async function fetchProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(data);
      setFormData({
        full_name: data?.full_name || '', email: session.user.email || '',
        gender: data?.gender || '', age: data?.age || '', avatar_url: data?.avatar_url || ''
      });
    }
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleImageChange = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData({ ...formData, avatar_url: data.publicUrl });
      setMessage({ text: 'Image uploaded! Save profile to finalize.', type: 'success' });
    } catch (error) {
      alert('Error uploading image!');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from('profiles').update({
        full_name: formData.full_name, gender: formData.gender, age: formData.age, avatar_url: formData.avatar_url,
      }).eq('id', session.user.id);

    if (!error) {
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      fetchProfile();
      setTimeout(() => setActiveView('main'), 1500);
    } else {
      setMessage({ text: 'Error updating profile.', type: 'error' });
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      alert("New passwords do not match!"); return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email, password: passwordData.current,
    });

    if (signInError) {
      alert("Current password mismatch!"); return;
    }

    const { error } = await supabase.auth.updateUser({ password: passwordData.new });
    if (!error) {
      alert("Password changed successfully!");
      setActiveView('main');
      setPasswordData({ current: '', new: '', confirm: '' });
    } else {
      alert(error.message);
    }
  };

  const FolderHeader = ({ title }) => (
    <div className="flex items-center gap-4 px-6 pt-12 pb-6 shrink-0">
      <button onClick={() => { setActiveView('main'); setMessage({text:'', type:''}); }} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <h2 className="text-xl font-black text-white">{title}</h2>
    </div>
  );

  if (loading && activeView === 'main') return <div className="fixed inset-0 z-[9999] bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="fixed inset-0 z-[9999] bg-neutral-950 flex flex-col animate-slide-up-full overflow-hidden">
      
      {activeView === 'main' && (
        <>
          <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top,24px)+1rem)] pb-4 shrink-0 relative z-20">
            <button onClick={onBack} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-[15px] font-black tracking-widest text-neutral-500 uppercase">Profile</span>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-10 no-scrollbar">
            <div className="flex flex-col items-center mt-6">
              <div className="relative group mb-4">
                <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600 to-cyan-500 rounded-full blur-2xl opacity-30"></div>
                <div className="relative w-28 h-28 rounded-full border-4 border-neutral-900 overflow-hidden bg-neutral-800 shadow-2xl">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-white text-3xl font-black italic">
                      {profile?.full_name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-black text-white">{profile?.full_name || 'AUXO User'}</h2>
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-10">Premium Member</p>

              <div className="w-full space-y-3">
                <MenuButton icon={<svg className="w-5 h-5 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} label="Edit Profile" onClick={() => setActiveView('edit')} />
                <MenuButton icon={<svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>} label="Change Password" onClick={() => setActiveView('password')} />
                
                {/* 🔴 2. DIRECT GMAIL FIX: Forces the browser to open Gmail Web Composer */}
                <MenuButton 
                  icon={<svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} 
                  label="Contact Us" 
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=vudia1706@gmail.com&su=Support%20Request%20-%20AUXO" 
                />
                
                <MenuButton icon={<svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} label="Help & FAQ" onClick={() => setActiveView('faq')} />
                <MenuButton icon={<svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} label="Terms & Conditions" onClick={() => setActiveView('terms')} />
                
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black tracking-widest text-xs uppercase active:scale-95 transition-all mt-6">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* EDIT PROFILE */}
      {activeView === 'edit' && (
        <div className="absolute inset-0 bg-neutral-950 z-[210] animate-slide-up-full flex flex-col">
          <FolderHeader title="Edit Profile" />
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-fuchsia-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-28 h-28 rounded-full border-2 border-white/10 overflow-hidden bg-neutral-900 shadow-2xl">
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                      <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.full_name}&background=random`} className="w-full h-full object-cover" alt="Avatar"/>
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20">
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Change</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
              <p className="text-[10px] text-neutral-600 font-bold uppercase mt-3 tracking-widest">Tap image to change</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="px-6 space-y-5">
              {message.text && <div className={`p-3 text-xs font-bold rounded-lg text-center ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{message.text}</div>}
              <Input label="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
              <Input label="Email Address" value={formData.email} disabled />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-4 rounded-xl bg-neutral-900 border border-white/5 text-white outline-none appearance-none">
                    <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
                <Input label="Age" type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>
              <button type="submit" disabled={uploading || loading} className="w-full py-5 bg-fuchsia-600 text-white font-black rounded-2xl shadow-lg shadow-fuchsia-600/20 active:scale-95 transition-all mt-4">
                {loading ? 'SAVING...' : 'SAVE PROFILE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD */}
      {activeView === 'password' && (
        <div className="absolute inset-0 bg-neutral-950 z-[210] animate-slide-up-full flex flex-col">
          <FolderHeader title="Security" />
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            <form onSubmit={handleChangePassword} className="px-6 space-y-5">
              <Input label="Current Password" type="password" required value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} />
              <Input label="New Password" type="password" required value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} />
              <Input label="Retype New Password" type="password" required value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} />
              <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-lg active:scale-95 transition-all mt-4">Update Password</button>
            </form>
          </div>
        </div>
      )}

      {/* STATIC FOLDERS */}
      {(activeView === 'faq' || activeView === 'terms') && (
        <div className="absolute inset-0 bg-neutral-950 z-[210] animate-slide-up-full flex flex-col">
          <FolderHeader title={activeView === 'faq' ? "Help & FAQ" : "Terms & Conditions"} />
          <div className="flex-1 px-6 text-neutral-400 text-sm leading-relaxed overflow-y-auto no-scrollbar pb-10">
            {activeView === 'faq' ? (
              <div className="space-y-6">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">How do I change my avatar?</h4><p>Go to Edit Profile, tap your current profile picture, and select a new image from your gallery.</p></div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">What is Auxo AI?</h4><p>Our AI curates playlists based on your listening mood, local trends, and listening history.</p></div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">How do I contact support?</h4><p>Tap the "Contact Us" button in the settings menu to send an email directly to our support team.</p></div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-white font-bold text-lg">1. Data Privacy</h3><p>By using AUXO, you agree to our data processing terms. We use Supabase for secure data storage and do not sell your personal listening habits to third parties.</p>
                <h3 className="text-white font-bold text-lg mt-6">2. Content Usage</h3><p>All music and audio content provided within the AUXO application is for personal, non-commercial use only. Unauthorized distribution is prohibited.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function MenuButton({ icon, label, onClick, href }) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-black/50 flex items-center justify-center border border-white/5">
          {icon}
        </div>
        <span className="text-white font-bold text-sm">{label}</span>
      </div>
      <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
    </>
  );

  const className = "w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-white/5 active:scale-95 transition-all";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">{label}</label>
      <input {...props} className="w-full p-4 rounded-xl bg-neutral-900 border border-white/5 text-white outline-none focus:border-fuchsia-500/50 transition-colors disabled:opacity-50" />
    </div>
  );
}