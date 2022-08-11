import React, {useCallback, useEffect, useRef, useMemo} from 'react';
import {
  BackHandler,
  Keyboard,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import {FAB, IconButton, Menu, Snackbar, TextInput} from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';

import {
  useFocusEffect,
  useNavigation,
  CommonActions,
} from '@react-navigation/native';
import {isAndroid, isWeb, isWindows} from '../utils/device/DeviceInfo';

import auth from '@react-native-firebase/auth';
import CountriesList from '../components/Modals/LoginScreen/CountriesList';
import PrivacyPolicy from '../components/Modals/PrivacyPolicy/PrivacyPolicy';
import {COLORS, FONTS} from '../config/Miscellaneous';
import OTPTextView from '../components/OtpView/OTPTextInput';
import firestore from '@react-native-firebase/firestore';
import LoginHelp from '../components/Modals/LoginScreen/LoginHelp';
import ArrowForward from '../assets/images/arrow-forward.png';
import DotsImage from '../assets/images/dots.png';
import BaseView from '../components/BaseView/BaseView';
import MiniBaseView from '../components/MiniBaseView/MiniBaseView';
import LoadingIndicator from '../components/Modals/CustomLoader/LoadingIndicator';
import {
  getManufacturer,
  getModel,
  getProduct,
  getSystemName,
  getSystemVersion,
  getVersion,
} from 'react-native-device-info';
import {fontValue, heightPercentageToDP} from '../config/Dimensions';
import {getRandomInt} from '../utils/generators/getRandomNumber';
import {JwtKeyMMKV} from '../config/MMKV/JwtKeyMMKV';
import {ErrorToast} from '../components/ToastInitializer/ToastInitializer';

const LoginScreen = () => {
  /**
   * Dummy NetInfoObserver
   */

  const addNetInfoObserver = () => {
    NetInfo.addEventListener(networkState => {
      console.info(networkState.details);
      console.info(networkState.type);
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  useEffect(() => {
    addNetInfoObserver();
    const currentSubscriber = auth()?.onAuthStateChanged(onAuthStateChanged);
    const LoginScreenTimerTask = setTimeout(async () => {
      let isConnected = await NetInfo.fetch();
      if (isConnected.isConnected) {
        getCountryCodeFromApi();
      } else {
        setErrorSnackbarText(
          'Please enable your Mobile Data or WiFi Network to can you access Moon Meet and Login',
        );
        setErrorSnackBarVisible(true);
      }
    }, 500);
    return () => {
      currentSubscriber();
      addNetInfoObserver();
      clearTimeout(LoginScreenTimerTask);
    };
  }, []);

  const navigation = useNavigation();

  const [CountryText, CountrySetText] = React.useState('+');

  const [NumberText, NumberSetText] = React.useState('');

  const [MenuVisible, setMenuVisible] = React.useState(false);

  const openMenu = () => setMenuVisible(true);

  const closeMenu = () => setMenuVisible(false);

  // Bottom Sheet Refs

  const helpRef = useRef(null);
  const privacyRef = useRef(null);
  const countriesRef = useRef(null);
  const sheetSnapPoints = useMemo(() => ['50%', '100%'], []);

  // Bottom Sheet Callbacks

  const handlePresentHelpModal = useCallback(() => {
    Keyboard.dismiss();
    privacyRef?.current?.forceClose();
    countriesRef?.current?.forceClose();
    helpRef?.current?.present();
  }, []);

  const handlePresentPrivacyModal = useCallback(() => {
    Keyboard.dismiss();
    helpRef?.current?.forceClose();
    countriesRef?.current?.forceClose();
    privacyRef?.current?.present();
  }, []);

  const handlePresentCountriesModal = useCallback(() => {
    Keyboard.dismiss();
    privacyRef?.current?.forceClose();
    helpRef?.current?.forceClose();
    countriesRef?.current?.present();
  }, []);

  const handleForceCloseAllModals = useCallback(() => {
    helpRef?.current?.forceClose();
    privacyRef?.current?.forceClose();
    countriesRef?.current?.forceClose();
  }, []);

  /**
   * allow SMS sending if country code and number is probably real
   * @returns {boolean}
   */

  const isSMSSendingAcceptable = () => {
    return CountryText.length > 1 && NumberText.length > 4;
  };

  /**
   * Firebase Phone Auth Stuff
   */

  function onAuthStateChanged(currentUser) {
    setMoonMeetUser(currentUser);
  }
  const phoneRef = useRef();

  const [MoonMeetUser, setMoonMeetUser] = React.useState();

  const [ConfirmCode, setConfirmCode] = React.useState(null);

  /**
   * Loader stuff
   */
  const [LoaderVisible, setLoaderVisible] = React.useState(false);

  /**
   * function to send code to specific phone number.
   * @param {NaN, String} phoneNumber
   * @returns {Promise<void>}
   */

  async function signInWithPhoneNumber(phoneNumber) {
    const sendCodeTask = await auth()?.signInWithPhoneNumber(phoneNumber);
    setConfirmCode(sendCodeTask);
    setLoaderVisible(false);
  }

  /**
   * SnackBar Stuff
   */

  const [mBottomMargin, setBottomMargin] = React.useState(0);

  const [ErrorSnackbarText, setErrorSnackbarText] = React.useState('');

  const [ErrorSnackBarVisible, setErrorSnackBarVisible] = React.useState(false);

  const onToggleErrorSnackBar = useCallback(() => {
    setErrorSnackBarVisible(!ErrorSnackBarVisible);
  }, [ErrorSnackBarVisible]);

  const onDismissErrorSnackBar = () => {
    setBottomMargin(0);
    setErrorSnackBarVisible(!ErrorSnackBarVisible);
  };

  /**
   * get dial code from internet API
   * @return {NaN, String} data to {CountryText}
   */
  const getCountryCodeFromApi = async () => {
    const ApiURL = 'https://ipapi.co/country_calling_code';
    try {
      await fetch(ApiURL)
        .then(dialCode => dialCode?.text())
        .then(data => {
          if (data?.includes('error')) {
            CountrySetText('+1');
          } else {
            CountrySetText(data);
          }
        });
    } catch (e) {
      console.error(e);
      CountrySetText(+1);
    }
  };

  const countryInputOnFocus = () => {
    Keyboard.dismiss();
    handleForceCloseAllModals();
    handlePresentCountriesModal();
  };

  /**
   * Used for getting Device Information, useful for DeviceScreen.js
   */

  const [systemName, setSystemName] = React.useState(getSystemName());
  const [systemVersion, setSystemVersion] = React.useState(getSystemVersion());
  const [Manufacturer, setManufacturer] = React.useState(
    getManufacturer().then(manufacturer => {
      setManufacturer(manufacturer);
    }),
  );
  const [Product, setProduct] = React.useState(
    getProduct().then(product => {
      setProduct(product);
    }),
  );
  const [Model, setModel] = React.useState(getModel());
  const [appVersion, setAppVersion] = React.useState(getVersion());

  async function addCodeObserver(text) {
    if (text?.length > 5) {
      Keyboard.dismiss();
      try {
        setLoaderVisible(true);
        await ConfirmCode.confirm(text);
        firestore()
          .collection('users')
          .doc(auth()?.currentUser?.uid)
          .get()
          .then(documentSnapshot => {
            if (documentSnapshot?.exists) {
              if (documentSnapshot?.data()?.uid) {
                JwtKeyMMKV.set(
                  'currentUserJwtKey',
                  documentSnapshot?.data().jwtKey,
                );
                /**
                 * pushing device information for later use in DeviceScreen.js
                 */
                if (!isWindows && !isWeb) {
                  firestore()
                    .collection('users')
                    .doc(auth()?.currentUser?.uid)
                    .collection('devices')
                    .add({
                      manufacturer: Manufacturer,
                      system_name: systemName,
                      system_version: systemVersion,
                      product: Product,
                      model: Model,
                      app_version: appVersion,
                      time: firestore?.Timestamp?.fromDate(new Date()),
                    })
                    .catch(error => {
                      console.error(error);
                      setLoaderVisible(false);
                    });
                }
                setLoaderVisible(false);
                navigation?.dispatch(
                  CommonActions?.reset({
                    index: 0,
                    routes: [{name: 'login'}],
                  }),
                );
                navigation?.navigate('home');
              }
            } else {
              const generatedUsername = auth()
                ?.currentUser?.uid?.substring(0, 4)
                .concat(getRandomInt(100000, 999999));
              navigation?.dispatch(
                CommonActions?.reset({
                  index: 0,
                  routes: [{name: 'login'}],
                }),
              );
              navigation?.navigate('setup', {
                user: {
                  uid: auth()?.currentUser?.uid,
                  username: generatedUsername,
                  phone: NumberText,
                  phone_number: CountryText + ' ' + NumberText,
                  phone_status: 'none',
                  country_code: CountryText,
                },
              });
              setLoaderVisible(false);
            }
          });
        setLoaderVisible(false);
      } catch (error) {
        setLoaderVisible(false);
        if (error !== null) {
          if (error.code === 'auth/invalid-verification-code') {
            setLoaderVisible(false);
          }
          ErrorToast(
            'bottom',
            'Invalid code',
            'Try checking if the code is correct or not',
            true,
            2000,
          );
        } else {
          setLoaderVisible(false);
          ErrorToast(
            'bottom',
            'Account linking error',
            'Try restarting Moon Meet and try again',
            true,
            2000,
          );
        }
      }
    }
  }

  /**
   * What a bottom sheet, you need to close it to times to dismiss lol
   * @param {NaN, String} data
   */

  const setCountryCodeData = data => {
    countriesRef?.current?.close();
    CountrySetText(data);
    countriesRef?.current?.forceClose();
  };

  /**
   * Clean up NumberText
   * @param {NaN, String} text
   */
  const onNumberTextChange = text => {
    /**
     * Regex for removing crap characters in NumberText
     * @type {RegExp}
     * @private
     */
    let allowedCharactersRegex = /[^0-9]/g;
    NumberSetText(text?.replace(allowedCharactersRegex, ''));
  };

  return (
    //////////////////////////// FIRST PART ////////////////////////////
    <BaseView>
      <Pressable style={{flex: 1}} onPress={() => handleForceCloseAllModals()}>
        <View style={{alignItems: 'flex-end'}}>
          <Menu
            visible={MenuVisible}
            onDismiss={closeMenu}
            anchor={
              <IconButton
                icon={DotsImage}
                color={'#999999'}
                size={24}
                onPress={() => {
                  openMenu();
                }}
              />
            }>
            <Menu.Item
              onPress={() => {
                handleForceCloseAllModals();
                handlePresentHelpModal();
              }}
              title="Help"
            />
          </Menu>
        </View>
        {!ConfirmCode ? (
          <MiniBaseView>
            <View style={styles.top_bar}>
              <Text style={styles.top_text}>
                Enter your phone number to get started
              </Text>
            </View>
            <View
              style={{
                paddingLeft: '2%',
                paddingRight: '2%',
              }}>
              <Text
                style={{
                  color: COLORS.black,
                  fontSize: fontValue(16),
                  textAlign: 'center',
                  paddingBottom: '4%',
                  opacity: 0.4,
                  fontFamily: FONTS.regular,
                }}>
                You will receive a verification code, Carrier rates {'\n'} may
                apply.
              </Text>
            </View>
            <View
              style={{
                padding: '2%',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <TextInput
                style={{
                  width: '36%',
                }}
                mode="outlined"
                keyboardType={isAndroid ? 'numeric' : 'number-pad'}
                label="Country Code"
                value={CountryText}
                maxLength={5}
                onFocus={() => {
                  handleForceCloseAllModals();
                  countryInputOnFocus();
                }}
                multiline={false}
                theme={{
                  colors: {
                    text: COLORS.accentLight,
                    primary: COLORS.accentLight,
                    backgroundColor: COLORS.rippleColor,
                    placeholder: COLORS.darkGrey,
                    underlineColor: '#566193',
                    selectionColor: '#DADADA',
                    outlineColor: '#566193',
                  },
                }}
                onChangeText={text => {
                  CountrySetText(text);
                }}
              />
              <TextInput
                style={{
                  width: '62%',
                  paddingRight: '2%',
                }}
                mode="outlined"
                keyboardType={isAndroid ? 'numeric' : 'number-pad'}
                label="Phone Number"
                value={NumberText}
                onFocus={() => handleForceCloseAllModals()}
                placeholder={'eg, (123) 456 7890'}
                maxLength={12}
                multiline={false}
                theme={{
                  colors: {
                    text: COLORS.accentLight,
                    primary: COLORS.accentLight,
                    backgroundColor: COLORS.rippleColor,
                    placeholder: COLORS.darkGrey,
                    underlineColor: '#566193',
                    selectionColor: '#DADADA',
                    outlineColor: '#566193',
                  },
                }}
                onChangeText={_NumberText => {
                  onNumberTextChange(_NumberText);
                }}
              />
            </View>
            <View
              style={{
                paddingLeft: '4%',
                paddingRight: '2%',
                position: 'relative',
              }}>
              <Text
                style={{
                  color: COLORS.black,
                  fontSize: fontValue(16),
                  opacity: 0.4,
                  fontFamily: FONTS.regular,
                }}>
                By signing up.
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                position: 'relative',
                paddingLeft: '4%',
                paddingRight: '2%',
              }}>
              <Text
                style={{
                  color: COLORS.black,
                  fontSize: fontValue(16),
                  opacity: 0.4,
                  fontFamily: FONTS.regular,
                }}>
                You agree to the{' '}
              </Text>
              <Text
                style={{
                  color: COLORS.accentLight,
                  fontSize: fontValue(16),
                  fontFamily: FONTS.regular,
                }}
                onPress={() => handlePresentPrivacyModal()}>
                Terms of Service
              </Text>
            </View>
            <Snackbar
              visible={ErrorSnackBarVisible}
              onDismiss={onDismissErrorSnackBar}
              duration={3000}
              action={{
                label: 'OK',
                onPress: () => {
                  onDismissErrorSnackBar();
                },
              }}
              theme={{
                colors: {
                  onSurface: COLORS.redLightError,
                  accent: COLORS.white,
                },
              }}
              style={{
                margin: '4%',
              }}>
              {ErrorSnackbarText}
            </Snackbar>
            <FAB
              style={styles.fab(mBottomMargin)}
              normal
              icon={ArrowForward}
              color={COLORS.primaryLight}
              animated={true}
              theme={{
                colors: {
                  accent: COLORS.accentLight,
                },
              }}
              onPress={async () => {
                try {
                  Keyboard.dismiss();
                  const isConnected = await NetInfo.fetch();
                  if (isConnected.isConnected) {
                    if (isSMSSendingAcceptable()) {
                      setLoaderVisible(true);
                      signInWithPhoneNumber(CountryText + NumberText)?.catch(
                        () => {
                          setLoaderVisible(false);
                        },
                      );
                    } else {
                      setBottomMargin(heightPercentageToDP(7.5));
                      setErrorSnackbarText(
                        'Please enter a valid Country Code and Phone Number',
                      );
                      onToggleErrorSnackBar();
                    }
                  } else {
                    setBottomMargin(heightPercentageToDP(7.5));
                    setErrorSnackbarText(
                      'Please enable your Mobile Data or WiFi Network to can you access Moon Meet and Login',
                    );
                    onToggleErrorSnackBar();
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
            />
            <PrivacyPolicy
              sheetRef={privacyRef}
              index={0}
              snapPoints={sheetSnapPoints}
            />
            <CountriesList
              sheetRef={countriesRef}
              index={0}
              snapPoints={sheetSnapPoints}
              sharedData={setCountryCodeData}
            />
            <LoginHelp
              sheetRef={helpRef}
              index={0}
              snapPoints={sheetSnapPoints}
            />
            <LoadingIndicator isVisible={LoaderVisible} />
          </MiniBaseView>
        ) : (
          //////////////////////////// SECOND PART ////////////////////////////
          /**
           * Render ConfirmScreen when user is in ConfirmCode mode.
           */
          <MiniBaseView style={styles.container}>
            <Pressable
              style={{flex: 1}}
              onPress={() => {
                handleForceCloseAllModals();
              }}>
              <View style={styles.top_bar}>
                <Text style={styles.top_text}>
                  Enter the code that we sent {'\n'} to{' '}
                  {CountryText + ' ' + NumberText}
                </Text>
              </View>
              <View style={styles.centredView}>
                <OTPTextView
                  inputCount={6}
                  ref={phoneRef}
                  tintColor={COLORS.accentLight}
                  offTintColor={COLORS.controlHighlight}
                  containerStyle={styles.TextInputContainer}
                  textInputStyle={styles.RoundedTextInput}
                  handleTextChange={text => {
                    addCodeObserver(text);
                  }}
                  keyboardType={'numeric'}
                />
              </View>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  paddingTop: '3%',
                  paddingBottom: '3%',
                  paddingLeft: '2%',
                  paddingRight: '2%',
                }}>
                <View
                  style={{
                    flex: 1,
                  }}>
                  <Text
                    style={{
                      position: 'relative',
                      fontSize: fontValue(16),
                      color: COLORS.black,
                      opacity: 0.4,
                      textAlign: 'left',
                      fontFamily: FONTS.regular,
                    }}
                    onPress={() => {
                      navigation?.dispatch(
                        CommonActions?.reset({
                          index: 0,
                          routes: [{name: 'login'}],
                        }),
                      );
                    }}>
                    WRONG NUMBER
                  </Text>
                </View>
                <Text
                  style={{
                    position: 'relative',
                    fontSize: fontValue(16),
                    color: COLORS.black,
                    opacity: 0.4,
                    textAlign: 'right',
                    fontFamily: FONTS.regular,
                  }}
                  onPress={() => {
                    phoneRef?.current?.clear();
                  }}>
                  CLEAR CODE
                </Text>
              </View>
              <LoginHelp
                sheetRef={helpRef}
                index={0}
                snapPoints={sheetSnapPoints}
              />
              <LoadingIndicator isVisible={LoaderVisible} />
            </Pressable>
          </MiniBaseView>
        )}
      </Pressable>
    </BaseView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
  },
  top_bar: {
    flexDirection: 'row',
    paddingTop: '3%',
    paddingBottom: '3%',
    paddingLeft: '2%',
    paddingRight: '2%',
    justifyContent: 'center',
  },
  top_text: {
    position: 'relative',
    fontSize: fontValue(28),
    paddingLeft: '3%',
    paddingRight: '3%',
    textAlign: 'center',
    color: COLORS.accentLight,
    fontFamily: FONTS.regular,
  },
  TextInputContainer: {
    marginRight: heightPercentageToDP(8),
    marginLeft: heightPercentageToDP(8),
  },
  RoundedTextInput: {
    borderRadius: heightPercentageToDP(1),
    borderWidth: 2,
  },
  centredView: {
    paddingLeft: '2%',
    paddingRight: '2%',
    alignSelf: 'center',
  },
  fab: bottomMargin => {
    return {
      position: 'absolute',
      margin: 16 - 0.1 * 16,
      right: 0,
      bottom: bottomMargin,
    };
  },
});
export default LoginScreen;
