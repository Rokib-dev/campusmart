import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
  Platform,
  useWindowDimensions,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

/* ================================================= */
/* CONSTANTS */
/* ================================================= */

const STORAGE_KEY = "onboardingCompleted";

const COLORS = {
  primary: "#8B5CF6",
  dark: "#1B153B",
  white: "#FFFFFF",
  background: "#F7F3FF",
  skip: "#6D5B95",
  description: "#756D88",
  brand: "#9B8DBB",
  shadow: "#000000",
};

/* Desktop starts from 900px. */
const DESKTOP_BREAKPOINT = 900;

/* Phone height breakpoints. */
const SMALL_PHONE_HEIGHT = 700;
const MEDIUM_PHONE_HEIGHT = 820;

/* Mobile sizes for each phone height tier. */
const MOBILE_SIZES = {
  small: { imageSize: 165, visualHeight: 175, titleSize: 25 },
  medium: { imageSize: 185, visualHeight: 195, titleSize: 28 },
  regular: { imageSize: 205, visualHeight: 220, titleSize: 31 },
};

/* Animation ranges (shared by slides and dots). */
const SLIDE_ANIMATION = {
  scale: [0.88, 1, 0.88],
  opacity: [0.45, 1, 0.45],
  translateY: [25, 0, 25],
};

const DOT_ANIMATION = {
  width: [8, 25, 8],
  opacity: [0.3, 1, 0.3],
};

/* ================================================= */
/* ONBOARDING DATA */
/* ================================================= */

const SLIDES = [
  {
    id: "1",
    title: "Your Campus.",
    title2: "Your Marketplace.",
    description:
      "Buy new and used products easily from students on your campus.",
    type: "buy",
    variant: "student",
    image: require("../assets/images/student-3.png"),
    badge: { icon: "cart-outline", label: "Buy", side: "left" },
  },

  {
    id: "2",
    title: "Sell With",
    title2: "Ease.",
    description:
      "List your products and reach students who are looking for what you sell.",
    type: "sell",
    variant: "student",
    image: require("../assets/images/student-2.png"),
    badge: { icon: "pricetag-outline", label: "Sell", side: "right" },
  },

  {
    id: "3",
    title: "We Handle",
    title2: "The Delivery.",
    description:
      "Buy with confidence. We collect the item from the seller and deliver it to you.",
    type: "delivery",
    variant: "delivery",
    image: require("../assets/images/delivery-rider.png"),
    badge: null,
  },
];

const LAST_INDEX = SLIDES.length - 1;

const LOGO = require("../assets/images/logo.png");

/* ================================================= */
/* HELPERS */
/* ================================================= */

/*
  Builds an interpolation that peaks when the slide
  (or dot) at `index` is centered on screen.
*/
const interpolateAtIndex = (scrollX, index, width, outputRange) =>
  scrollX.interpolate({
    inputRange: [(index - 1) * width, index * width, (index + 1) * width],
    outputRange,
    extrapolate: "clamp",
  });

/* ================================================= */
/* RESPONSIVE HOOK */
/* ================================================= */

/*
  One place for every responsive decision.
  Sizes also adapt to the screen width so they
  never overflow on very narrow phones.
*/
const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isDesktop = width >= DESKTOP_BREAKPOINT;
    const isSmallPhone = height < SMALL_PHONE_HEIGHT;
    const isMediumPhone =
      height >= SMALL_PHONE_HEIGHT && height < MEDIUM_PHONE_HEIGHT;

    const tier = isSmallPhone
      ? MOBILE_SIZES.small
      : isMediumPhone
      ? MOBILE_SIZES.medium
      : MOBILE_SIZES.regular;

    return {
      width,
      height,
      isDesktop,
      isSmallPhone,
      isMediumPhone,
      mobileImageSize: Math.min(tier.imageSize, width * 0.62),
      mobileVisualHeight: tier.visualHeight,
      mobileTitleSize: Math.min(tier.titleSize, width * 0.085),
    };
  }, [width, height]);
};

/* ================================================= */
/* TOP BAR */
/* ================================================= */

const TopBar = memo(function TopBar({ isDesktop, showSkip, onSkip }) {
  return (
    <View
      style={[
        styles.topBar,
        isDesktop ? styles.topBarDesktop : styles.topBarMobile,
      ]}
    >
      <Image
        source={LOGO}
        style={[
          styles.logo,
          isDesktop ? styles.logoDesktop : styles.logoMobile,
        ]}
        resizeMode="contain"
      />

      {showSkip && (
        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipButton}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

/* ================================================= */
/* SLIDE PARTS */
/* ================================================= */

const SlideBadge = memo(function SlideBadge({ badge, isDesktop }) {
  const positionStyle =
    badge.side === "left"
      ? isDesktop
        ? styles.buyBadgeDesktop
        : styles.buyBadgeMobile
      : isDesktop
      ? styles.sellBadgeDesktop
      : styles.sellBadgeMobile;

  return (
    <View style={[styles.smallBadge, positionStyle]}>
      <Ionicons name={badge.icon} size={20} color={COLORS.primary} />

      <Text style={styles.badgeText}>{badge.label}</Text>
    </View>
  );
});

const SlideVisual = memo(function SlideVisual({
  item,
  isDesktop,
  mobileImageSize,
  mobileVisualHeight,
}) {
  const isDelivery = item.variant === "delivery";

  const containerStyle = isDelivery
    ? styles.deliveryVisual
    : styles.studentVisual;

  const imageBaseStyle = isDelivery
    ? styles.deliveryImage
    : styles.studentImage;

  const imageDesktopStyle = isDelivery
    ? styles.deliveryImageDesktop
    : styles.studentImageDesktop;

  return (
    <View
      style={[
        styles.visualArea,
        isDesktop
          ? styles.visualAreaDesktop
          : { height: mobileVisualHeight },
      ]}
    >
      <View style={containerStyle}>
        <Image
          source={item.image}
          style={[
            imageBaseStyle,
            isDesktop
              ? imageDesktopStyle
              : { width: mobileImageSize, height: mobileImageSize },
          ]}
          resizeMode="contain"
        />

        {item.badge && (
          <SlideBadge badge={item.badge} isDesktop={isDesktop} />
        )}
      </View>
    </View>
  );
});

const SlideText = memo(function SlideText({
  item,
  isDesktop,
  mobileTitleSize,
}) {
  const titleSizeStyle = isDesktop
    ? styles.desktopTitle
    : { fontSize: mobileTitleSize, lineHeight: mobileTitleSize + 5 };

  return (
    <View
      style={[
        styles.textContainer,
        isDesktop ? styles.textContainerDesktop : styles.textContainerMobile,
      ]}
    >
      <Text style={[styles.title, titleSizeStyle]}>{item.title}</Text>

      <Text style={[styles.titlePurple, titleSizeStyle]}>{item.title2}</Text>

      <Text
        style={[
          styles.description,
          isDesktop ? styles.desktopDescription : styles.mobileDescription,
        ]}
      >
        {item.description}
      </Text>
    </View>
  );
});

/* ================================================= */
/* SLIDE */
/* ================================================= */

const Slide = memo(function Slide({ item, index, scrollX, layout }) {
  const { width, isDesktop } = layout;

  const scale = interpolateAtIndex(
    scrollX,
    index,
    width,
    SLIDE_ANIMATION.scale
  );

  const opacity = interpolateAtIndex(
    scrollX,
    index,
    width,
    SLIDE_ANIMATION.opacity
  );

  const translateY = interpolateAtIndex(
    scrollX,
    index,
    width,
    SLIDE_ANIMATION.translateY
  );

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View
        style={[
          styles.slideContent,
          isDesktop ? styles.slideContentDesktop : styles.slideContentMobile,
          {
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}
      >
        <SlideVisual
          item={item}
          isDesktop={isDesktop}
          mobileImageSize={layout.mobileImageSize}
          mobileVisualHeight={layout.mobileVisualHeight}
        />

        <SlideText
          item={item}
          isDesktop={isDesktop}
          mobileTitleSize={layout.mobileTitleSize}
        />
      </Animated.View>
    </View>
  );
});

/* ================================================= */
/* PAGINATION DOTS */
/* ================================================= */

const PaginationDot = memo(function PaginationDot({
  index,
  scrollX,
  width,
}) {
  const dotWidth = interpolateAtIndex(
    scrollX,
    index,
    width,
    DOT_ANIMATION.width
  );

  const dotOpacity = interpolateAtIndex(
    scrollX,
    index,
    width,
    DOT_ANIMATION.opacity
  );

  return (
    <Animated.View
      style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
    />
  );
});

const PaginationDots = memo(function PaginationDots({ scrollX, width }) {
  return (
    <View style={styles.dotsContainer}>
      {SLIDES.map((slide, index) => (
        <PaginationDot
          key={slide.id}
          index={index}
          scrollX={scrollX}
          width={width}
        />
      ))}
    </View>
  );
});

/* ================================================= */
/* BOTTOM BUTTONS */
/* ================================================= */

const AuthButtons = memo(function AuthButtons({ isDesktop, onFinish }) {
  const handleLogin = useCallback(() => onFinish("Login"), [onFinish]);

  const handleSignUp = useCallback(() => onFinish("SignUp"), [onFinish]);

  return (
    <View
      style={[
        styles.authButtons,
        isDesktop ? styles.authButtonsDesktop : styles.authButtonsMobile,
      ]}
    >
      {/* LOGIN */}
      <TouchableOpacity
        style={[
          styles.loginButton,
          isDesktop ? styles.desktopAuthButton : styles.mobileAuthButton,
        ]}
        activeOpacity={0.8}
        onPress={handleLogin}
      >
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      {/* CREATE ACCOUNT */}
      <TouchableOpacity
        style={[
          styles.signupButton,
          isDesktop ? styles.desktopAuthButton : styles.mobileAuthButton,
        ]}
        activeOpacity={0.8}
        onPress={handleSignUp}
      >
        <Text style={styles.signupText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
});

const ContinueButton = memo(function ContinueButton({
  isDesktop,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.continueButton,
        isDesktop
          ? styles.continueButtonDesktop
          : styles.continueButtonMobile,
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={styles.continueText}>Continue</Text>

      <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
    </TouchableOpacity>
  );
});

/* ================================================= */
/* WELCOME SCREEN */
/* ================================================= */

export default function WelcomeScreen({ navigation }) {
  const layout = useResponsive();
  const { width, isDesktop } = layout;

  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLastSlide = currentIndex === LAST_INDEX;

  /* ================================================= */
  /* FINISH ONBOARDING */
  /* ================================================= */

  const finishOnboarding = useCallback(
    async (screen) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, "true");
      } catch (error) {
        console.log("Error saving onboarding:", error);
      }

      navigation.navigate(screen);
    },
    [navigation]
  );

  /* ================================================= */
  /* GO TO SLIDE */
  /* ================================================= */

  const goToSlide = useCallback((index) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });

    setCurrentIndex(index);
  }, []);

  /* ================================================= */
  /* SKIP */
  /* ================================================= */

  const handleSkip = useCallback(() => {
    goToSlide(LAST_INDEX);
  }, [goToSlide]);

  /* ================================================= */
  /* CONTINUE */
  /* ================================================= */

  const handleContinue = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, goToSlide]);

  /* ================================================= */
  /* SLIDER HANDLERS */
  /* ================================================= */

  const keyExtractor = useCallback((item) => item.id, []);

  const renderSlide = useCallback(
    ({ item, index }) => (
      <Slide
        item={item}
        index={index}
        scrollX={scrollX}
        layout={layout}
      />
    ),
    [scrollX, layout]
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width]
  );

  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true }
      ),
    [scrollX]
  );

  const handleMomentumScrollEnd = useCallback(
    (event) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);

      setCurrentIndex(index);
    },
    [width]
  );

  /* ================================================= */
  /* SCREEN */
  /* ================================================= */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* TOP BAR */}
      <TopBar
        isDesktop={isDesktop}
        showSkip={!isLastSlide}
        onSkip={handleSkip}
      />

      {/* SLIDER */}
      <Animated.FlatList
        ref={flatListRef}
        style={styles.slider}
        data={SLIDES}
        keyExtractor={keyExtractor}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      {/* BOTTOM AREA */}
      <View
        style={[
          styles.bottomArea,
          isDesktop ? styles.bottomAreaDesktop : styles.bottomAreaMobile,
        ]}
      >
        <PaginationDots scrollX={scrollX} width={width} />

        {isLastSlide ? (
          <AuthButtons isDesktop={isDesktop} onFinish={finishOnboarding} />
        ) : (
          <ContinueButton isDesktop={isDesktop} onPress={handleContinue} />
        )}

        <Text style={styles.brandText}>BUY • SELL • CONNECT</Text>
      </View>
    </SafeAreaView>
  );
}

/* ================================================= */
/* STYLES */
/* ================================================= */

const styles = StyleSheet.create({
  /* ===============================================
     GENERAL
  =============================================== */

  container: {
    flex: 1,
    backgroundColor: COLORS.background,

    /* SafeAreaView does nothing on Android, so add the status bar height. */
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },

  /* ===============================================
     TOP BAR
  =============================================== */

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topBarMobile: {
    height: 75,
    paddingHorizontal: 20,
    marginTop: 14,
  },

  topBarDesktop: {
    height: 105,
    paddingHorizontal: 55,
    maxWidth: 1250,
    width: "100%",
    alignSelf: "center",
  },

  logo: {
    height: 65,
  },

  logoMobile: {
    width: 145,
  },

  logoDesktop: {
    width: 185,
  },

  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  skipText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.skip,
  },

  /* ===============================================
     SLIDER
  =============================================== */

  slider: {
    flex: 1,
  },

  /* ===============================================
     SLIDE
  =============================================== */

  slide: {
    flex: 1,
    justifyContent: "center",
  },

  /* ===============================================
     MOBILE CONTENT
  =============================================== */

  slideContentMobile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
    paddingVertical: 4,
  },

  /* ===============================================
     DESKTOP CONTENT
  =============================================== */

  slideContentDesktop: {
    flex: 1,
    width: "100%",
    maxWidth: 1150,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
    gap: 50,
  },

  /* ===============================================
     VISUAL
  =============================================== */

  visualArea: {
    justifyContent: "center",
    alignItems: "center",
  },

  visualAreaDesktop: {
    flex: 1.15,
    height: "100%",
  },

  /* ===============================================
     STUDENT
  =============================================== */

  studentVisual: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  studentImage: {
    backgroundColor: "transparent",
  },

  studentImageDesktop: {
    width: "100%",
    maxWidth: 570,
    height: "85%",
  },

  /* ===============================================
     BADGES
  =============================================== */

  smallBadge: {
    position: "absolute",
    minWidth: 82,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.white,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    elevation: 5,

    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  buyBadgeMobile: {
    left: "5%",
    bottom: 5,
  },

  sellBadgeMobile: {
    right: "5%",
    bottom: 5,
  },

  buyBadgeDesktop: {
    left: "5%",
    bottom: "10%",
  },

  sellBadgeDesktop: {
    right: "5%",
    bottom: "10%",
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
  },

  /* ===============================================
     DELIVERY
  =============================================== */

  deliveryVisual: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  deliveryImage: {
    backgroundColor: "transparent",
  },

  deliveryImageDesktop: {
    width: "100%",
    maxWidth: 600,
    height: "88%",
  },

  /* ===============================================
     TEXT
  =============================================== */

  textContainer: {
    alignItems: "center",
  },

  textContainerMobile: {
    width: "100%",
    paddingHorizontal: 8,
    marginTop: 0,
  },

  textContainerDesktop: {
    flex: 0.9,
    alignItems: "flex-start",
    paddingHorizontal: 15,
  },

  title: {
    fontWeight: "800",
    color: COLORS.dark,
  },

  desktopTitle: {
    fontSize: 46,
    lineHeight: 54,
    textAlign: "left",
  },

  titlePurple: {
    fontWeight: "800",
    color: COLORS.primary,
  },

  description: {
    color: COLORS.description,
  },

  mobileDescription: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 340,
  },

  desktopDescription: {
    marginTop: 18,
    fontSize: 18,
    lineHeight: 29,
    textAlign: "left",
    maxWidth: 470,
  },

  /* ===============================================
     BOTTOM
  =============================================== */

  bottomArea: {
    paddingHorizontal: 20,
  },

  bottomAreaMobile: {
    paddingBottom: 12,
  },

  bottomAreaDesktop: {
    width: "100%",
    maxWidth: 1150,
    alignSelf: "center",
    paddingHorizontal: 50,
    paddingBottom: 28,
  },

  /* ===============================================
     DOTS
  =============================================== */

  dotsContainer: {
    height: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },

  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },

  /* ===============================================
     CONTINUE
  =============================================== */

  continueButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: COLORS.primary,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,
  },

  continueButtonMobile: {
    width: "100%",
  },

  continueButtonDesktop: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  continueText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  /* ===============================================
     AUTH BUTTONS
  =============================================== */

  authButtons: {
    gap: 8,
  },

  authButtonsMobile: {
    width: "100%",
  },

  authButtonsDesktop: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  loginButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,

    justifyContent: "center",
    alignItems: "center",
  },

  signupButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: COLORS.primary,

    justifyContent: "center",
    alignItems: "center",
  },

  mobileAuthButton: {
    width: "100%",
  },

  desktopAuthButton: {
    width: "100%",
  },

  loginText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },

  signupText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },

  /* ===============================================
     BRAND
  =============================================== */

  brandText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    color: COLORS.brand,
  },
});