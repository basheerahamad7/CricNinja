"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Check, 
  AlertCircle,
  PlusCircle,
  UserPlus,
  MapPin
} from 'lucide-react';
import { useAuth, useFirebase, useUser, initiateGoogleSignIn } from '@/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { checkUsernameAvailable, reserveUsername, generateUsernameSuggestions } from '@/services/username';
import { 
  PrimaryRole, 
  BattingHand, 
  BattingPosition, 
  BowlingArm, 
  BowlingStyle, 
  Specialization, 
  CricNinjaUser 
} from '@/types/user';
import { getCountries, getStates, getCities, COUNTRIES, STATES, CITIES } from '@/lib/location-data';

export default function OnboardingPage() {
  const router = useRouter();
  const auth = useAuth();
  const { firestore: db } = useFirebase();
  const { user, userProfile } = useUser();

  const [step, setStep] = useState<number>(1);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [primaryRole, setPrimaryRole] = useState<PrimaryRole | null>(null);
  const [battingHand, setBattingHand] = useState<BattingHand | null>(null);
  const [battingPosition, setBattingPosition] = useState<BattingPosition | null>(null);
  const [bowlingArm, setBowlingArm] = useState<BowlingArm | null>(null);
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle | string | null>(null);
  const [specialization, setSpecialization] = useState<Specialization | string | null>(null);

  // Location State (Standardized IDs - Require explicit user selection)
  const [countryId, setCountryId] = useState<string>('');
  const [stateId, setStateId] = useState<string>('');
  const [cityId, setCityId] = useState<string>('');

  // Username State
  const [username, setUsername] = useState<string>('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState<boolean>(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  // Optional Info State
  const [jerseyNumber, setJerseyNumber] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [favoriteFormats, setFavoriteFormats] = useState<string[]>([]);

  // Sync existing onboarding state from Firestore if available
  useEffect(() => {
    if (userProfile) {
      if (userProfile.onboardingStep) {
        setStep(userProfile.onboardingStep);
      }

      if (userProfile.cricket?.primaryRole) setPrimaryRole(userProfile.cricket.primaryRole);
      if (userProfile.cricket?.batting?.hand) setBattingHand(userProfile.cricket.batting.hand);
      if (userProfile.cricket?.batting?.position) setBattingPosition(userProfile.cricket.batting.position);
      if (userProfile.cricket?.bowling?.arm) setBowlingArm(userProfile.cricket.bowling.arm);
      if (userProfile.cricket?.bowling?.style) setBowlingStyle(userProfile.cricket.bowling.style);
      if (userProfile.cricket?.specialization) setSpecialization(userProfile.cricket.specialization);

      if (userProfile.location?.countryId) setCountryId(userProfile.location.countryId);
      if (userProfile.location?.stateId) setStateId(userProfile.location.stateId);
      if (userProfile.location?.cityId) setCityId(userProfile.location.cityId);

      if (userProfile.account?.username) setUsername(userProfile.account.username);
      if (userProfile.cricket?.jerseyNumber) setJerseyNumber(String(userProfile.cricket.jerseyNumber));
      if (userProfile.account?.bio) setBio(userProfile.account.bio);
      if (userProfile.cricket?.favoriteFormats) setFavoriteFormats(userProfile.cricket.favoriteFormats);
    } else if (user && db) {
      setStep(3);
      // Auto-sync Google Account metadata to Firestore
      const userRef = doc(db, 'users', user.uid);
      setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email || '',
          account: {
            displayName: user.displayName || 'Cricket Player',
            photoURL: user.photoURL || '',
          },
        },
        { merge: true }
      );
    }
  }, [user, userProfile, db, router]);

  // Generate Username Suggestions when arriving at Step 7
  useEffect(() => {
    if (step === 7 && user?.displayName && usernameSuggestions.length === 0) {
      const suggestions = generateUsernameSuggestions(user.displayName);
      setUsernameSuggestions(suggestions);
      if (!username) {
        setUsername(suggestions[0]);
      }
    }
  }, [step, user, usernameSuggestions, username]);

  // Validate Username in real time
  useEffect(() => {
    if (step !== 7 || !db || !username) {
      setIsUsernameAvailable(null);
      return;
    }

    const clean = username.toLowerCase().trim();
    if (clean.length < 3) {
      setIsUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      const available = await checkUsernameAvailable(db, clean, user?.uid);
      setIsUsernameAvailable(available);
      setIsCheckingUsername(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [username, db, step]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      const res = await initiateGoogleSignIn(auth);
      if (res?.user && db) {
        const userRef = doc(db, 'users', res.user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
          const initialUserData: Partial<CricNinjaUser> = {
            uid: res.user.uid,
            email: res.user.email || '',
            profileCompleted: false,
            onboardingStep: 3,
            profileCompletion: 20,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            account: {
              displayName: res.user.displayName || 'Cricket Player',
              username: '',
              photoURL: res.user.photoURL || '',
              bio: '',
            },
            location: {
              countryId: 'IN',
              country: 'India',
              stateId: 'IN-TG',
              state: 'Telangana',
              cityId: 'IN-TG-HYD',
              city: 'Hyderabad',
            },
            cricket: {
              primaryRole: null,
              batting: { hand: null, position: null },
              bowling: { arm: null, style: null },
              jerseyNumber: null,
              favoriteFormats: [],
            },
            social: { followers: 0, following: 0, verified: false },
            careerStats: { matches: 0, runs: 0, wickets: 0, highestScore: 0, bestBowling: '0/0' },
            achievements: [],
            badges: [],
          };

          await setDoc(userRef, initialUserData, { merge: true });
        }
        setStep(3);
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      toast({
        title: 'Sign In Failed',
        description: err?.message || 'Could not complete Google Sign-In.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const updateFirestoreStep = async (nextStep: number, nextCompletion: number, extraData: any = {}) => {
    if (!user || !db) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef, 
        {
          uid: user.uid,
          email: user.email || '',
          onboardingStep: nextStep,
          profileCompletion: nextCompletion,
          updatedAt: serverTimestamp(),
          ...extraData,
        },
        { merge: true }
      );
      setStep(nextStep);
    } catch (err) {
      console.error('Error saving onboarding step:', err);
      toast({ title: 'Error saving progress', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWelcomeNext = () => updateFirestoreStep(4, 20);

  const handleRoleSelect = (role: PrimaryRole) => setPrimaryRole(role);

  const handleRoleNext = () => {
    if (!primaryRole) return;
    updateFirestoreStep(5, 35, { 'cricket.primaryRole': primaryRole });
  };

  const handleRoleDetailsNext = () => {
    updateFirestoreStep(6, 50, {
      'cricket.batting.hand': battingHand,
      'cricket.batting.position': battingPosition,
      'cricket.bowling.arm': bowlingArm,
      'cricket.bowling.style': bowlingStyle,
      'cricket.specialization': specialization,
    });
  };

  const handleLocationNext = () => {
    if (!countryId || !stateId || !cityId) {
      toast({
        title: 'Location Selection Required',
        description: 'Please select your Country, State, and City to proceed.',
        variant: 'destructive',
      });
      return;
    }

    const selectedCountry = COUNTRIES.find(c => c.id === countryId);
    const selectedState = STATES.find(s => s.id === stateId);
    const selectedCity = CITIES.find(c => c.id === cityId);

    updateFirestoreStep(7, 65, {
      location: {
        countryId,
        country: selectedCountry?.name || '',
        stateId,
        state: selectedState?.name || '',
        cityId,
        city: selectedCity?.name || '',
      }
    });
  };

  const handleUsernameNext = async () => {
    if (!username || !isUsernameAvailable || !user || !db) return;

    setIsSaving(true);
    const reserved = await reserveUsername(db, username, user.uid);
    if (!reserved) {
      toast({
        title: 'Username Taken',
        description: 'That username was just taken by someone else. Please choose another.',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    await updateFirestoreStep(8, 85, {
      'account.username': username.toLowerCase().trim(),
    });
    setIsSaving(false);
  };

  const handleCompleteOnboarding = async (skipOptional = false) => {
    if (!user || !db) return;
    setIsSaving(true);

    const finalJersey = jerseyNumber ? parseInt(jerseyNumber, 10) : null;
    const finalBio = skipOptional ? '' : bio;
    const finalFormats = skipOptional ? [] : favoriteFormats;

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef, 
        {
          profileCompleted: true,
          onboardingStep: 9,
          profileCompletion: 100,
          cricket: {
            jerseyNumber: finalJersey,
            favoriteFormats: finalFormats,
          },
          account: {
            bio: finalBio,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setStep(9);
    } catch (err) {
      console.error('Error completing onboarding:', err);
      toast({ title: 'Could not complete profile setup', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFormat = (fmt: string) => {
    if (favoriteFormats.includes(fmt)) {
      setFavoriteFormats(favoriteFormats.filter(f => f !== fmt));
    } else {
      setFavoriteFormats([...favoriteFormats, fmt]);
    }
  };

  const getDisplayName = () => {
    return user?.displayName || userProfile?.account?.displayName || 'Cricket Player';
  };

  const getPhotoURL = () => {
    return user?.photoURL || userProfile?.account?.photoURL || '';
  };

  const getFirstName = () => {
    const name = getDisplayName();
    return name.split(' ')[0];
  };

  const currentCountryName = COUNTRIES.find(c => c.id === countryId)?.name || 'India';
  const currentCityName = CITIES.find(c => c.id === cityId)?.name || 'Hyderabad';
  const progressPercent = Math.round(((step - 1) / 8) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto select-none">
      
      {/* Header Progress */}
      {step > 1 && step < 9 && (
        <div className="w-full space-y-3 pt-2 pb-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5 text-primary">
              <Shield className="w-4 h-4" /> CricNinja
            </span>
            <span>Step {step} of 9</span>
          </div>
          <Progress value={progressPercent} className="h-2 rounded-full bg-muted" />
        </div>
      )}

      {/* Screen 1: Splash */}
      {step === 1 && (
        <div className="my-auto text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 py-10">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary shadow-xl shadow-primary/10">
            <Shield className="w-12 h-12" />
          </div>

          <div className="space-y-3">
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary py-1 px-3">
              Official Player Registration
            </Badge>
            <h1 className="font-headline font-black text-4xl uppercase tracking-tight text-foreground">
              CricNinja
            </h1>
            <p className="text-lg font-bold text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Your Cricket.<br />
              Your Career.<br />
              <span className="text-primary">Your Legacy.</span>
            </p>
          </div>

          <div className="pt-6 space-y-4">
            <Button 
              onClick={handleGoogleLogin} 
              disabled={isSigningIn}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 gap-3 text-white"
            >
              {isSigningIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">
              No Guest Mode. Trusted Authentication Required.
            </p>
          </div>
        </div>
      )}

      {/* Screen 3: Welcome */}
      {step === 3 && (
        <div className="my-auto space-y-8 animate-in slide-in-from-right duration-300 py-6">
          <div className="space-y-3">
            <h2 className="font-headline font-black text-3xl uppercase tracking-tight">
              Welcome, {getFirstName()} 👋
            </h2>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              We&apos;ll create your official CricNinja cricket profile in under one minute.
            </p>
          </div>

          <Card className="bg-muted/40 border-primary/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shrink-0">
                {getPhotoURL() ? (
                  <img src={getPhotoURL()} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {getFirstName()[0]}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Google Identity
            </div>
          </Card>

          <Button 
            onClick={handleWelcomeNext}
            disabled={isSaving}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 text-white"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Screen 4: Role */}
      {step === 4 && (
        <div className="my-auto space-y-6 animate-in slide-in-from-right duration-300 py-4">
          <div className="space-y-1">
            <h2 className="font-headline font-black text-2xl uppercase tracking-tight">
              Choose Primary Role
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Select your main position on the cricket field.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'batter', title: 'Batter', icon: '🏏', desc: 'Run Machine' },
              { id: 'bowler', title: 'Bowler', icon: '🎯', desc: 'Wicket Taker' },
              { id: 'all_rounder', title: 'All-Rounder', icon: '⭐', desc: 'Dual Threat' },
              { id: 'keeper', title: 'Wicket Keeper', icon: '🧤', desc: 'Glove Master' },
            ].map((role) => {
              const isSelected = primaryRole === role.id;
              return (
                <Card
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id as PrimaryRole)}
                  className={`cursor-pointer rounded-3xl transition-all p-5 border-2 relative text-center space-y-3 ${
                    isSelected 
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/30 scale-[1.02]' 
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="text-4xl">{role.icon}</div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight">{role.title}</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold">{role.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <Button
            onClick={handleRoleNext}
            disabled={!primaryRole || isSaving}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 text-white"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Screen 5: Role Details */}
      {step === 5 && (
        <div className="my-auto space-y-6 animate-in slide-in-from-right duration-300 py-4">
          <div className="space-y-1">
            <h2 className="font-headline font-black text-2xl uppercase tracking-tight">
              {primaryRole === 'batter' && 'Batting Details'}
              {primaryRole === 'bowler' && 'Bowling Details'}
              {primaryRole === 'all_rounder' && 'All-Rounder Skillset'}
              {primaryRole === 'keeper' && 'Keeper Details'}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Tailor your specific playing style.
            </p>
          </div>

          <div className="space-y-5">
            {(primaryRole === 'batter' || primaryRole === 'all_rounder' || primaryRole === 'keeper') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Batting Hand</label>
                <div className="grid grid-cols-2 gap-3">
                  {['right', 'left'].map(hand => (
                    <Button
                      key={hand}
                      variant={battingHand === hand ? 'default' : 'outline'}
                      onClick={() => setBattingHand(hand as BattingHand)}
                      className={`h-12 rounded-2xl font-black uppercase text-xs ${battingHand === hand ? 'text-white' : ''}`}
                    >
                      {hand} Hand
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {(primaryRole === 'batter' || primaryRole === 'keeper') && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Batting Position</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'opener', label: 'Opener' },
                    { id: 'top_order', label: 'Top Order (3-4)' },
                    { id: 'middle_order', label: 'Middle Order (5-7)' },
                    { id: 'finisher', label: 'Finisher (8+)' }
                  ].map(pos => (
                    <Button
                      key={pos.id}
                      variant={battingPosition === pos.id ? 'default' : 'outline'}
                      onClick={() => setBattingPosition(pos.id as BattingPosition)}
                      className={`h-12 rounded-2xl font-black uppercase text-xs ${battingPosition === pos.id ? 'text-white' : ''}`}
                    >
                      {pos.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {(primaryRole === 'bowler' || primaryRole === 'all_rounder') && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bowling Arm</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['right', 'left'].map(arm => (
                      <Button
                        key={arm}
                        variant={bowlingArm === arm ? 'default' : 'outline'}
                        onClick={() => setBowlingArm(arm as BowlingArm)}
                        className={`h-12 rounded-2xl font-black uppercase text-xs ${bowlingArm === arm ? 'text-white' : ''}`}
                      >
                        {arm} Arm
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bowling Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'fast', label: 'Fast' },
                      { id: 'fast_medium', label: 'Fast Medium' },
                      { id: 'medium_pace', label: 'Medium Pace' },
                      { id: 'off_spin', label: 'Off Spin' },
                      { id: 'leg_spin', label: 'Leg Spin' },
                      { id: 'left_arm_orthodox', label: 'Left Arm Orthodox' },
                    ].map(style => (
                      <Button
                        key={style.id}
                        variant={bowlingStyle === style.id ? 'default' : 'outline'}
                        onClick={() => setBowlingStyle(style.id)}
                        className={`h-11 rounded-xl font-bold uppercase text-[10px] ${bowlingStyle === style.id ? 'text-white' : ''}`}
                      >
                        {style.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {primaryRole === 'all_rounder' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preferred Strength</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'batting_all_rounder', label: 'Batting' },
                    { id: 'balanced', label: 'Balanced' },
                    { id: 'bowling_all_rounder', label: 'Bowling' }
                  ].map(spec => (
                    <Button
                      key={spec.id}
                      variant={specialization === spec.id ? 'default' : 'outline'}
                      onClick={() => setSpecialization(spec.id)}
                      className={`h-12 rounded-2xl font-black uppercase text-[10px] ${specialization === spec.id ? 'text-white' : ''}`}
                    >
                      {spec.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleRoleDetailsNext}
            disabled={isSaving}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 text-white mt-4"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Screen 6: Cascading Standardized Location Selectors */}
      {step === 6 && (
        <div className="my-auto space-y-6 animate-in slide-in-from-right duration-300 py-4">
          <div className="space-y-1">
            <h2 className="font-headline font-black text-2xl uppercase tracking-tight flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" /> Select Location
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Standardized location selection for official leaderboard rankings.
            </p>
          </div>

          <div className="space-y-4">
            {/* Country Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Country</label>
              <Select value={countryId} onValueChange={(val) => {
                setCountryId(val);
                setStateId('');
                setCityId('');
              }}>
                <SelectTrigger className="h-12 rounded-2xl border-border bg-card font-bold text-sm">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {getCountries().map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-bold text-xs py-2.5">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">State / Province</label>
              <Select value={stateId} disabled={!countryId} onValueChange={(val) => {
                setStateId(val);
                setCityId('');
              }}>
                <SelectTrigger className="h-12 rounded-2xl border-border bg-card font-bold text-sm">
                  <SelectValue placeholder={countryId ? "Select State" : "Select Country First"} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {getStates(countryId).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="font-bold text-xs py-2.5">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">City</label>
              <Select value={cityId} disabled={!stateId} onValueChange={(val) => setCityId(val)}>
                <SelectTrigger className="h-12 rounded-2xl border-border bg-card font-bold text-sm">
                  <SelectValue placeholder={stateId ? "Select City" : "Select State First"} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {getCities(stateId).map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-bold text-xs py-2.5">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleLocationNext}
            disabled={!countryId || !stateId || !cityId || isSaving}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 text-white"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Screen 7: Username */}
      {step === 7 && (
        <div className="my-auto space-y-6 animate-in slide-in-from-right duration-300 py-4">
          <div className="space-y-1">
            <h2 className="font-headline font-black text-2xl uppercase tracking-tight">
              Create Handle
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Choose a unique public username for your global player card.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">@</span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                maxLength={20}
                className="h-14 pl-9 rounded-2xl border-border bg-muted/30 font-bold text-base tracking-wide"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isCheckingUsername && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                {!isCheckingUsername && isUsernameAvailable === true && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {!isCheckingUsername && isUsernameAvailable === false && (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>

            {isUsernameAvailable === false && (
              <p className="text-[11px] text-destructive font-bold px-1">
                This username is already taken or invalid (min 3 chars).
              </p>
            )}

            {usernameSuggestions.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {usernameSuggestions.map((sug) => (
                    <Badge
                      key={sug}
                      variant="outline"
                      onClick={() => setUsername(sug)}
                      className="cursor-pointer rounded-full px-3 py-1.5 font-mono text-xs hover:border-primary border-border bg-card transition-colors"
                    >
                      @{sug}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleUsernameNext}
            disabled={!username || !isUsernameAvailable || isCheckingUsername || isSaving}
            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 text-white"
          >
            Reserve Handle <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Screen 8: Optional Info */}
      {step === 8 && (
        <div className="my-auto space-y-6 animate-in slide-in-from-right duration-300 py-4">
          <div className="space-y-1">
            <h2 className="font-headline font-black text-2xl uppercase tracking-tight">
              Optional Details
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              You can complete these now or edit them later in Settings.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Jersey Number</label>
              <Input
                type="number"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="e.g. 7, 18, 45"
                className="h-12 rounded-2xl border-border bg-muted/30 font-bold"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bio</label>
                <span className="text-[10px] font-mono text-muted-foreground">{bio.length}/100</span>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 100))}
                placeholder="Short cricket bio (e.g. Aggressive opening batsman from Hyderabad)"
                className="rounded-2xl border-border bg-muted/30 font-medium text-xs resize-none h-20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Favorite Formats</label>
              <div className="flex flex-wrap gap-2">
                {['T20', 'ODI', 'Test', 'Tennis Ball', 'Box Cricket'].map((fmt) => {
                  const isSel = favoriteFormats.includes(fmt);
                  return (
                    <Badge
                      key={fmt}
                      variant={isSel ? 'default' : 'outline'}
                      onClick={() => toggleFormat(fmt)}
                      className={`cursor-pointer rounded-full px-3.5 py-1.5 font-bold uppercase text-[10px] transition-all ${
                        isSel ? 'bg-primary text-white' : 'border-border text-muted-foreground'
                      }`}
                    >
                      {fmt}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleCompleteOnboarding(true)}
              disabled={isSaving}
              className="w-1/3 h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Skip
            </Button>
            <Button
              onClick={() => handleCompleteOnboarding(false)}
              disabled={isSaving}
              className="w-2/3 h-14 rounded-2xl font-black uppercase tracking-widest text-sm gap-2 text-white"
            >
              Finish Setup <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Screen 9: Success / Profile Preview */}
      {step === 9 && (
        <div className="my-auto space-y-6 animate-in zoom-in-95 duration-500 py-6 text-center">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase tracking-widest py-1 px-3">
              PROFILE CREATED 🎉
            </Badge>
            <h2 className="font-headline font-black text-3xl uppercase tracking-tight">
              You&apos;re Ready!
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Your permanent CricNinja identity is live.
            </p>
          </div>

          {/* Profile Card Preview */}
          <Card className="bg-card border-primary/20 shadow-2xl rounded-3xl p-6 space-y-5 text-left relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shrink-0 shadow-md">
                {getPhotoURL() ? (
                  <img src={getPhotoURL()} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {getFirstName()[0]}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base uppercase tracking-tight">{getDisplayName()}</h3>
                  {jerseyNumber && (
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black">
                      #{jerseyNumber}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-primary font-mono font-bold">@{username}</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-border text-muted-foreground">
                    {primaryRole?.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-border text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {currentCityName}, {currentCountryName}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-muted/40 p-4 rounded-2xl text-center">
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase">MATCHES</p>
                <p className="text-base font-black text-primary">0</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase">RUNS / WKT</p>
                <p className="text-base font-black text-foreground">0 / 0</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => router.push('/matches/create')}
              className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-2 text-white"
            >
              <PlusCircle className="w-4 h-4" /> Create Match
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-2"
            >
              <UserPlus className="w-4 h-4" /> Go to Home
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="py-2 text-center text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">
        Powered by CricNinja Engine
      </div>
    </div>
  );
}
