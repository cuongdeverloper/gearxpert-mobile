import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { Colors } from "../../../../constants/theme";
import { 
  getRememberMe, 
  setRememberMe, 
  getSavedEmail, 
  setSavedEmail, 
  clearSavedEmail,
  getSavedPassword,
  setSavedPassword,
  clearSavedPassword
} from "../../../shared/utils/storage";
import { ApiLogin } from "../api";


WebBrowser.maybeCompleteAuthSession();

// Get screen dimensions
const { width, height } = Dimensions.get("window");

export const SignIn = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMeState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadSavedData = async () => {
      const savedEmail = await getSavedEmail();
      const savedPassword = await getSavedPassword();
      const rememberPref = await getRememberMe();
      if (rememberPref) {
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMeState(true);
      }
    };
    loadSavedData();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ApiLogin(email, password);

      if (response.errorCode === 0 && response.data) {
        // Handle Remember Me
        if (rememberMe) {
          await setRememberMe(true);
          await setSavedEmail(email);
          await setSavedPassword(password);
        } else {
          await setRememberMe(false);
          await clearSavedEmail();
          await clearSavedPassword();
        }

        if (response.data.role === "CUSTOMER" || response.data.role === "OPERATION_STAFF") {
          // Use global login to update state immediately
          await login(response.data.access_token);
          // Redirection is now handled robustly by _layout.tsx
        } else {
          Alert.alert("Thông báo", "App mobile hiện chỉ hỗ trợ Customer và Staff");
        }
      } else {
        Alert.alert("Lỗi", response.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi kết nối server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = Linking.createURL('oauth2/callback');
      const stateObj = { mobile: true, redirectUrl };
      const authUrl = `https://gearxpert-production.up.railway.app/auth/google?state=${encodeURIComponent(JSON.stringify(stateObj))}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        try {
          const parsedUrl = Linking.parse(result.url);
          const { queryParams } = parsedUrl;
          
          if (queryParams?.error) {
            Alert.alert("Lỗi", decodeURIComponent(queryParams.error as string));
            return;
          }

          if (queryParams?.accessToken) {
            const accessToken = decodeURIComponent(queryParams.accessToken as string);
            
            await login(accessToken);
            // Redirection is now handled robustly by _layout.tsx
          }
        } catch (parseError) {
          console.error("Error parsing login result:", parseError);
          Alert.alert("Lỗi", "Dữ liệu trả về bị lỗi. Không thể đăng nhập.");
        }
      }
    } catch (error) {
      console.error("Google login error:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi đăng nhập bằng Google");
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with mesh gradient feel */}
      <View style={styles.bgContainer}>
        <LinearGradient
          colors={['#0F172A', '#1E1B4B']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Glow Effects */}
        <View style={[styles.glowOrb, { top: -100, left: -50, backgroundColor: 'rgba(99, 102, 241, 0.4)' }]} />
        <View style={[styles.glowOrb, { bottom: -50, right: -100, backgroundColor: 'rgba(34, 211, 238, 0.3)' }]} />
      </View>

      <View style={styles.content}>
        {/* Header / Logo */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your GearXpert account</Text>
        </View>

        {/* Glassmorphism Panel */}
        <View style={styles.glassWrapper}>
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" style={styles.glassPanel}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.rememberMeContainer} 
                onPress={() => setRememberMeState(!rememberMe)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={rememberMe ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={rememberMe ? Colors.dark.accent : "#94A3B8"} 
                />
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#6366F1", "#22D3EE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>SIGN IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.socialDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                <Ionicons name="logo-google" size={24} color="#F1F5F9" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    filter: [{ blur: 60 }] as any, // Only works natively in some latest versions, fallback works via opacity
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F8FAFC",
    marginBottom: 8,
    // fontFamily: "SpaceGrotesk-Bold", // Enable if custom font is fully linked
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    // fontFamily: "Inter-Regular",
  },
  glassWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glassPanel: {
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    height: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rememberMeText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: '#94A3B8',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 15,
  },
  footerLink: {
    color: Colors.dark.accent,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
