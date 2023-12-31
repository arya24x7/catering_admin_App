import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TextInput } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, BottomNavigation, Button, Modal } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CommonActions } from '@react-navigation/routers';
import { useNavigation } from '@react-navigation/native';
import { SelectList } from 'react-native-dropdown-select-list';
import firestore from '@react-native-firebase/firestore';
import DocumentPicker from 'react-native-document-picker';
import storage from '@react-native-firebase/storage';
import { PermissionsAndroid, Platform } from 'react-native';
import { Image } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

const Tab = createBottomTabNavigator();

const dummyorderList = [
  // {ID: 1 , Name: "Neha",Phone: "9876543210",Date: "23-06-23"},
  // {ID: 2 , Name: "Abcd",Phone: "9876543120",Date: "22-06-23"},
  // {ID: 3 , Name: "Wxyz",Phone: "9876543201",Date: "21-06-23"},
  // {ID: 4 , Name: "Mnop",Phone: "9876542310",Date: "20-06-23"},
  // {ID: 5 , Name: "Qrst",Phone: "8976542310",Date: "19-06-23"},
  // {ID: 6 , Name: "Uvwx",Phone: "9867542310",Date: "18-06-23"},
  // {ID: 7 , Name: "Efdg",Phone: "9875642310",Date: "17-06-23"},
];

const Menu = [
  { ID: 1, Name: "Idli" },
  { ID: 2, Name: "Dosa" },
  { ID: 3, Name: "Poori" },
  { ID: 4, Name: "Upma" },
  { ID: 5, Name: "Kesari Bath" },
];

// const getOrderDetails = async () => {
//   try {
//     const snapshot = await firestore().collection('orderDetails').get();
//     const namesArray = [];
//     snapshot.docs.forEach((doc) => {
//       const name = doc.data().name;
//       namesArray.push(name);
//     });
//     const formatedNamesArr = namesArray.map((element ,index)=>({ID: index+1,name:element}))
//     console.log(namesArray);
//     console.log(formatedNamesArr)
//     setOrderList(formatedNamesArr) // Array containing all names
//   } catch (error) {
//     console.error('Error getting order details:', error);
//   }
//   return(orderList);
// };


function HomeScreen({ navigation }) {
  const [orderList, setOrderList] = useState(dummyorderList);


  //getOrderDetails();
  useEffect(() => {
    const getOrderDetails = async () => {
      try {
        const snapshot = await firestore().collection('orderDetails').get();
        const namesArray = [];
        const datesArr = [];
        const userIdArr = [];

        snapshot.docs.forEach(async (doc) => {
          userIdArr.push(doc.id)
          const datesArrIn = await doc.data().dates;
          //console.log("out",datesArrIn)
          for (const dates of datesArrIn) {
            // console.log("loop",dates)
            datesArr.push(dates);
            const detailsSnapshot = await doc.ref.collection(dates).doc("details").get();
            const name = detailsSnapshot.data().name;
            namesArray.push(name);
          }
          //console.log(name);
          const formattedNames = namesArray.map((name, index) => ({ ID: index + 1, Name: name, Date: datesArr[index], username: userIdArr[index] }));
          setOrderList(formattedNames)
        });
      } catch (error) {
        console.error('Error getting order details:', error);
      }
    };

    getOrderDetails();


  }, []);
  const handleCustomerInfo = (userID, date) => {
    navigation.navigate('CustomerDetails', { date, userID })
    // console.log("details sent",date,userID)
  }
  const handleOrderInfo = (userID, date) => {
    navigation.navigate('OrderedItems', { date, userID })
  }


  return (
    <ScrollView nestedScrollEnabled={true}>
      <FlatList
        data={orderList}
        style={{ flex: 1, marginTop: 40 }}
        renderItem={({ item }) => (
          <View style={styles.container1}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{item.Name}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{item.Date}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1, marginTop: 20 }}>
              <Button style={{ backgroundColor: 'rgba(0, 160, 116, 1)', color: 'white', borderRadius: 10 }} labelStyle={{ color: 'white' }} onPress={() => handleCustomerInfo(item.username, item.Date)}>Customer Info</Button>
              <Button style={{ backgroundColor: 'rgba(0, 160, 116, 1)', color: 'white', marginLeft: 40, borderRadius: 10 }} labelStyle={{ color: 'white' }} onPress={() => handleOrderInfo(item.username, item.Date)}>View Order</Button>
            </View>
          </View>
        )}
        keyExtractor={item => item.ID.toString()}
      />

    </ScrollView>
  );
}

function MenuScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const resolveContentUri = async (contentUri) => {
    try {
      if (contentUri.startsWith('content://')) {
        console.log("contenturiprep is going")
        const result = await RNFetchBlob.fs.stat(contentUri);
        if (result && result.path) {
          // Content URI resolved to an actual file path
          return result.path;
        } else {
          // Handle the case where resolution fails
          console.error('Failed to resolve content URI to file path');
          return null;
        }
      } else {
        console.log("sab changa")
        // Not a content URI, return as is
        return contentUri;
      }
    } catch (error) {
      // Handle any errors that occur during resolution
      console.error('Error resolving content URI:', error);
      return null;
    }
  };

  const selectImage = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Permission Request',
          message: 'This app needs permission to access your storage.',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const res = await DocumentPicker.pick({
          type: [DocumentPicker.types.images],
        });

        setSelectedImage(res);
        console.log("image selected", selectedImage[0].uri)
      } else {
        console.log("permission deined")

      }
    } catch (error) {
      console.log("Error", "Failed to pick image: " + error.message);
    }
  };

  const uploadImage = async (imageName) => {
    let pathToFile = null;

    try {
      if (selectedImage) {
        pathToFile = await resolveContentUri(selectedImage[0].uri)
        console.log("path1:", pathToFile)
      } else {
        // Use the default image path from the assets folder
        if (Platform.OS === 'android') {
          pathToFile = RNFetchBlob.fs.dirs.AssetDir + '/test.jpeg';
          console.log("path2:", pathToFile);
        } else {
          pathToFile = RNFetchBlob.fs.dirs.AssetDir + '/test.jpeg';
          console.log("path3:", pathToFile);
        }
      }

      const reference = storage().ref(imageName);
      //console.log(reference.getDownloadURL())

      try {
        await reference.putFile(pathToFile);
        additem(imageName);
        console.log("Success", "Image uploaded successfully!");
      } catch (error) {
        console.log("Error", "Failed to upload image: " + error.message);
      }
    }
    catch (e) {
      console.log("upload error", e)
    }
  };

  const [itemName, setItemName] = useState("test");
  const closeModal = () => {
    uploadImage(itemName);
    setSelectedImage(null);
    setModalVisible(false);

  };

  const backmodel = () => {
    setSelectedImage(null);
    setModalVisible(false);
  }






  const openModal = (itemName) => {
    if (itemName) {
      setItemName(itemName);
    }

    setModalVisible(true);
  };




  const [selectItemType, setSelectItemType] = React.useState('');

  const [foodList, setFoodList] = React.useState([]);
  const [dummyArr, setDummyArr] = React.useState([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('menu2')
      .doc(selectItemType)
      .onSnapshot(documentSnapshot => {
        console.log('User data: ', documentSnapshot.data().item);
        const res = documentSnapshot.data().item || [];
        console.log('res', res);
        setDummyArr(res);
        const updatedFoodList = res.map((item, index) => {
          return { ID: index + 1, Name: item };
        });
        setFoodList(updatedFoodList);
        //console.log("dummy array",dummyArr);
      });

    return () => unsubscribe();
    //getOrderDetails();
  }, [selectItemType]);

  var itemType = [
    { key: '1', value: 'ಸ್ವೀಟ್ಸ್' },
    { key: '2', value: 'ರಸಾಯನ' },
    { key: '3', value: 'ಪಾಯಸ' },
    { key: '4', value: 'ಕಾಯಿಹುಳಿ' },
  ];



  const removeItem = (name) => {
    console.log("remove item func called")
    console.log("foodlist in remove item", foodList)


    if (dummyArr.includes(name)) {

      var dltarr = dummyArr;
      console.log("dlt function started")
      const index = dltarr.indexOf(name);
      console.log("index of item", index)
      if (index !== -1) {
        dltarr.splice(index, 1);
        console.log('arr cart in dlt func', dltarr);
        setDummyArr(dltarr)
        console.log('dummyArr inside removeItem', dummyArr);
        firestore().collection('menu2').doc(selectItemType).update({
          item: dummyArr,
        });
      }

    }




  };

  const additem = (name) => {
    let tempArr = dummyArr;
    if (!tempArr.includes(name)) {
      tempArr.push(name);
      setDummyArr(tempArr);
      firestore().collection('menu2').doc(selectItemType).update({
        item: dummyArr,
      })
    }
  }


  return (
    <ScrollView nestedScrollEnabled={true}>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <SelectList
          data={itemType}
          setSelected={val => setSelectItemType(val)}
          save="value"
          placeholder="ಆಹಾರದ ಪ್ರಕಾರ"
          boxStyles={{ width: 150, marginTop: 20, marginLeft: 30 }}
          inputStyles={{ color: 'black' }}
          dropdownStyles={{ width: 150, marginLeft: 30 }}
          dropdownTextStyles={{ color: 'black' }}
          maxHeight={150}
          defaultOption={{ key: 'ಸ್ವೀಟ್ಸ್', value: 'ಸ್ವೀಟ್ಸ್' }}
        />
        <Button style={{ backgroundColor: 'rgba(0, 160, 116, 1)', color: 'white', marginLeft: 100, marginTop: 20, borderRadius: 10, width: 80 }} labelStyle={{ color: 'white' }} onPress={openModal} >Add</Button>
      </View>
      <FlatList
        data={foodList}
        style={{ flex: 1, marginTop: 30 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 20, marginVertical: 15, marginHorizontal: 30, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{item.Name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Button
                style={{ backgroundColor: 'rgba(0, 160, 116, 1)', color: 'white', borderRadius: 10, marginRight: 10 }}
                labelStyle={{ color: 'white' }}
                onPress={() => openModal(item.Name)}
              >
                Add Image
              </Button>
              <Button
                style={{ backgroundColor: 'rgba(160, 0, 44, 1)', color: 'white', borderRadius: 10 }}
                labelStyle={{ color: 'white' }}
                onPress={() => removeItem(item.Name)}
              >
                Remove
              </Button>
            </View>
          </View>

        )}
        keyExtractor={item => item.ID}
      />
      <Modal
        visible={isModalVisible}
        onRequestClose={closeModal}
        style={{
          height: 400,
          backgroundColor: 'white',
          marginTop: 200,
          marginHorizontal: 20,
          borderRadius: 10,
        }}>
        <Text style={{ marginHorizontal: 95, fontSize: 25, fontWeight: 'bold' }}>Add new Item</Text>
        <TextInput style={{ marginHorizontal: 20, marginTop: 30, backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 10, color: 'black' }} placeholder='Enter the item name' placeholderTextColor={'black'} onChangeText={text => setItemName(text)}></TextInput>
        {selectedImage && <Image source={{ uri: selectedImage[0].uri }} style={{ width: 200, height: 200 }} />}
        <Button onPress={selectImage}>Select Image</Button>
        <Button style={{ backgroundColor: 'rgba(160, 0, 44, 1)', marginTop: 30, marginHorizontal: 40, height: 50, borderRadius: 10 }} textColor='white' onPress={closeModal}>Save</Button>
        <Button style={{ backgroundColor: 'gray', marginTop: 10, marginHorizontal: 40, height: 50, borderRadius: 10 }} textColor='white' onPress={backmodel}>Close</Button>
      </Modal>

    </ScrollView>
  );
}

export default function MyComponent() {
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) {
              preventDefault();
            } else {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key];
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused, color, size: 24 });
            }

            return null;
          }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.title;

            return label;
          }}
        />
      )}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => {
            return <Icon name="home" size={size} color={color} />;
          },
        }}
      // children={({ navigation: tabNavigation }) => ( <HomeScreen tabNavigation={tabNavigation} />)}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color, size }) => {
            return <Icon name="cart" size={size} color={color} />;
          },
        }}
      // children={({ navigation: tabNavigation }) => ( <MenuScreen tabNavigation={tabNavigation} />)}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container1: {
    flex: 1, // Take up the available space 
    alignItems: 'center', // Center content horizontally
    backgroundColor: 'white', // Set background color
    padding: 16,
    borderRadius: 20, // Add padding around the container
    marginVertical: 10,
    marginHorizontal: 30
  },
});
