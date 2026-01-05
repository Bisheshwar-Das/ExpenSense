import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.text}>Hello World Test</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red', // Temporary - so we can see if anything renders
  },
  text: {
    fontSize: 30,
    color: 'black',
    fontWeight: 'bold',
  },
});