import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { exchangeGoogleToken } from "../api";
import { useNavigate } from 'react-router-dom';

const GoogleLogin = (props) => {
  // Mock authentication function
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('user-info');
    if (userInfo) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const responseGoogle = async (authResult) => {
    try {
      // For implicit flow, we get access_token directly
      if (authResult["access_token"]) {
        console.log('Got access token from Google:', authResult.access_token.substring(0, 20) + '...');

        // Send access token to backend to get JWT
        const result = await exchangeGoogleToken(authResult.access_token);
        console.log('Server response:', result.data);

        if (result.data && result.data.user && result.data.token) {
          const { email, name, image } = result.data.user;
          const token = result.data.token;

          // Validate token is a proper JWT (should have 3 parts separated by dots)
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error(`Invalid JWT token format. Got ${tokenParts.length} parts instead of 3`);
          }

          const obj = { email, name, token, image };
          console.log('Valid JWT token received. Setting user data:', { email, name, image, tokenLength: token.length });
          localStorage.setItem('user-info', JSON.stringify(obj));
          setUser(obj);
          console.log('✅ User data saved to localStorage');

          // Give localStorage time to persist, then check redirect
          setTimeout(() => {
            console.log('🔍 [GoogleLogin] Checking for redirectAfterLogin in localStorage...');
            console.log('🔍 [GoogleLogin] Current localStorage contents:', {
              'user-info': localStorage.getItem('user-info') ? '✓ Set' : '✗ Missing',
              'redirectAfterLogin': localStorage.getItem('redirectAfterLogin') || '✗ Missing'
            });

            let redirectUrl = localStorage.getItem('redirectAfterLogin');
            console.log('📍 [GoogleLogin] redirectUrl from localStorage:', redirectUrl);

            // Fallback: Check if there are UTM params in current URL or referrer
            if (!redirectUrl) {
              console.log('⚠️ [GoogleLogin] No stored redirect, checking current URL for UTM params...');
              const searchParams = new URLSearchParams(window.location.search);
              const utmSource = searchParams.get('utm_source');
              const utmRef = searchParams.get('ref');
              console.log('🔎 [GoogleLogin] Current URL params - utm_source:', utmSource, 'ref:', utmRef);

              if (utmSource || utmRef) {
                const params = [];
                if (utmSource) params.push(`utm_source=${utmSource}`);
                if (utmRef) params.push(`ref=${utmRef}`);
                redirectUrl = `/food?${params.join('&')}`;
                console.log('🔨 [GoogleLogin] Constructed fallback redirectUrl:', redirectUrl);
              }
            }

            if (redirectUrl) {
              console.log('✅ [GoogleLogin] Redirecting to:', redirectUrl);
              localStorage.removeItem('redirectAfterLogin'); // Clean up
              navigate(redirectUrl, { replace: true });
            } else {
              console.log('⚠️ [GoogleLogin] No redirectUrl found, navigating to home page...');
              navigate('/home', { replace: true });
            }
          }, 200);

        } else {
          console.error('Invalid response structure:', result.data);
          setError('Invalid response from server - missing user or token');
          throw new Error('Invalid response structure from server');
        }
      } else {
        console.log('Auth result:', authResult);
        setError('No token received from Google');
        throw new Error('No token received from Google');
      }
    } catch (e) {
      console.error('Error while Google Login...', e);
      setError(e.message || 'Failed to login with Google');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "implicit",
  });
  const bgImg1 = '/login/brosted-transparent.png'
  const bgImg2 = '/login/burger.jpg'



  const heroImg1 = "/home/cake.png";
  const heroImg2 = "/home/pan.png";

  return (
    <DefaultLayout>

      <div className="min-h-[calc(100vh-200px)] w-screen  flex items-center justify-center ">
        <div className=" absolute size-20 top-60"><img src={bgImg1} alt="" /></div>
      </div>


      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12" style={{ zIndex: 1 }}>
        <Card className="w-full max-w-md flex flex-col items-center justify-center bg-white/95 backdrop-blur  shadow-2xl border-quicktap-teal">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-quicktap-creamy ">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-200 text-base pt-4 ">
              <div className="text-quicktap-lightGray">Sign in with your Google account to continue</div>
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center space-y-6 pt-6">
            <Button
              className="bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 hover:border-quicktap-teal 
                         h-14 w-full max-w-xs font-semibold text-base shadow-md hover:shadow-lg 
                         transition-all duration-200 flex items-center justify-center gap-3"
              onClick={googleLogin}
            >
              <svg className="w-6 h-6" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
                <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
                <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
                <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
              </svg>
              Sign in with Google
            </Button>

            {error && (
              <div className="w-full max-w-xs p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm text-center font-medium">{error}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col items-center space-y-4 pb-6">
            <p className="text-sm text-gray-300 text-center">
              By signing in, you agree to our Terms of Service
            </p>
          </CardFooter>
        </Card>
      </div>

    </DefaultLayout>
  );
}

export default GoogleLogin;