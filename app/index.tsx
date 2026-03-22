import { Redirect } from 'expo-router';
import { useSession } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated } = useSession();
  
  return <Redirect href={isAuthenticated ? '/(app)/(tabs)/gallery' : '/(auth)/login'} />;
}
