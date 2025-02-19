import {StyleSheet} from 'react-native';
import {fontValue} from '../../config/Dimensions';
import {COLORS, FONTS} from '../../config/Miscellaneous';

export const IntroStyles = StyleSheet.create({
  PagerRender: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: '2%',
  },
  illustration: {
    height: 300 - 0.1 * 300,
    width: 300 - 0.1 * 300,
    bottom: '12.5%',
    position: 'relative',
  },
  introduction_top_text: {
    position: 'relative',
    textAlign: 'center',
    fontSize: fontValue(20),
    color: COLORS.accentLight,
    fontFamily: FONTS.regular,
  },
  introduction_bottom_text: {
    position: 'relative',
    textAlign: 'center',
    fontSize: fontValue(16),
    top: '2.5%',
    color: COLORS.black,
    opacity: 0.4,
    fontFamily: FONTS.regular,
  },
  introduction_button: {
    position: 'absolute',
    textAlign: 'center',
    fontSize: fontValue(20),
    bottom: '2.5%',
    fontFamily: FONTS.regular,
  },
});
