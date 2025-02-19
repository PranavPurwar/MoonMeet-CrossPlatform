import React, {useEffect} from 'react';
import MiniBaseView from '../components/MiniBaseView/MiniBaseView';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {COLORS, FONTS} from '../config/Miscellaneous';
import {ActivityIndicator, Avatar} from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import ScrollViewData from '../components/SettingsScreen/ScrollViewContainer';
import {useTheme} from 'react-native-paper';
import {ThemeContext} from '../config/Theme/Context';
import {PurpleBackground} from '../index.d';
import {fontValue} from '../config/Dimensions';

const SettingsScreen = () => {
  const [Loading, setLoading] = React.useState(true);

  const navigation = useNavigation();

  const [avatarURL, setAvatarURL] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [userName, setUserName] = React.useState('');
  const [userBio, setUserBio] = React.useState('');
  const [activeStatus, setActiveStatus] = React.useState('');
  const [activeTime, setActiveTime] = React.useState('');

  const theme = useTheme();
  const {toggleTheme, isThemeDark} = React.useContext(ThemeContext);

  const styles = StyleSheet.create({
    under_header: {
      padding: '2%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    under_header_text: {
      position: 'relative',
      fontSize: fontValue(24),
      paddingLeft: '3%',
      paddingRight: '3%',
      paddingTop: '1%',
      textAlign: 'center',
      color: COLORS.black,
      fontFamily: FONTS.regular,
    },
    bioText: userBio => {
      return {
        position: 'relative',
        fontSize: fontValue(16),
        paddingLeft: '2.5%',
        paddingRight: '2.5%',
        paddingTop: '1%',
        textAlign: 'center',
        color: COLORS.black,
        opacity: userBio ? 0.6 : 0.4,
        fontFamily: FONTS.regular,
      };
    },
  });

  useEffect(() => {
    const usersSubsriber = firestore()
      .collection('users')
      .doc(auth()?.currentUser?.uid)
      .onSnapshot(documentSnapshot => {
        if (documentSnapshot.exists) {
          setAvatarURL(documentSnapshot?.data()?.avatar);
          setFirstName(documentSnapshot?.data()?.first_name);
          setLastName(documentSnapshot?.data()?.last_name);
          setUserName(documentSnapshot?.data()?.username);
          setActiveStatus(documentSnapshot?.data()?.active_status);
          setActiveTime(documentSnapshot?.data()?.active_time);
          if (documentSnapshot?.data()?.bio) {
            setUserBio(documentSnapshot?.data()?.bio);
          }
        }
        setLoading(false);
      });
    return () => {
      usersSubsriber();
    };
  }, []);

  if (Loading) {
    return (
      <MiniBaseView>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <ActivityIndicator
            animating={true}
            size={'large'}
            color={isThemeDark ? COLORS.accentDark : COLORS.accentLight}
          />
        </View>
      </MiniBaseView>
    );
  }
  return (
    <MiniBaseView>
      <ScrollView>
        <View style={styles.under_header}>
          <Avatar.Image
            size={85}
            source={avatarURL ? {uri: avatarURL} : PurpleBackground}
          />
          <Text
            adjustsFontSizeToFit={
              firstName?.trim()?.length >= 10 && lastName?.trim()?.length >= 10
            }
            numberOfLines={
              firstName?.trim()?.length >= 10 && lastName?.trim()?.length >= 10
                ? 1
                : 2
            }
            style={styles.under_header_text}>
            {firstName + ' ' + lastName}
          </Text>
          {userBio ? (
            <Text
              adjustsFontSizeToFit={true}
              numberOfLines={1}
              onPress={() => navigation?.navigate('addBio')}
              style={styles.bioText(userBio)}>
              {userBio}
            </Text>
          ) : (
            <Text
              adjustsFontSizeToFit={true}
              numberOfLines={1}
              style={styles.bioText(userBio)}
              onPress={() => navigation?.navigate('addBio')}>
              Tap to add a bio
            </Text>
          )}
        </View>
        <ScrollViewData
          firstName={firstName}
          lastName={lastName}
          username={userName}
          avatar={avatarURL}
          userbio={userBio}
          activeStatus={activeStatus}
          activeTime={activeTime}
        />
      </ScrollView>
    </MiniBaseView>
  );
};

export default SettingsScreen;
