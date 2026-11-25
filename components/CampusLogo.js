
import React from "react";

import {
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

export default function CampusLogo({
  width,
  height,
  onLongPress,
}) {
  const { width: screenWidth } = useWindowDimensions();

  const isDesktop = screenWidth >= 900;

  const logoWidth =
    width || (isDesktop ? 190 : 155);

  const logoHeight =
    height || (isDesktop ? 60 : 52);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onLongPress={onLongPress}
      delayLongPress={2500}
      disabled={!onLongPress}
    >
      <Image
        source={require("../assets/images/logo.png")}
        style={[
          styles.logo,
          {
            width: logoWidth,
            height: logoHeight,
          },
        ]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: "center",
  },
});
