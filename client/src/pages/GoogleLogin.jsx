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


  return (
    <DefaultLayout>
      <div className="container py-12 flex items-center justify-center ">
        <Card className="w-full max-w-md bg-white border border-quicktap-teal hover:shadow-lg flex flex-col items-center justify-center">
          <CardHeader className="space-y-1">
            <CardTitle className="font-bold text-center  ">Sign in</CardTitle>
            <CardDescription className="text-sm text-quicktap-darkGray">
              Sign in to Browse the awesome features of QuickTap
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full flex items-center justify-center gap-2 bg-quicktap-teal text-gray-800 hover:bg-gray-100 border border-gray-300"
              onClick={googleLogin}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Sign in with Google
            </Button>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
}

export default GoogleLogin;