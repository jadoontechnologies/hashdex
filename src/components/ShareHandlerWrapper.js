// src/components/ShareHandlerWrapper.js
import React from 'react';
import { View, Text } from 'react-native';
import useShareHandler from '../hooks/useShareHandler';

const ShareHandlerWrapper = ({ children }) => {
  try {
    useShareHandler();

    return (
      <View style={{ flex: 1 }}>
        {wrapChildren(children)}
      </View>
    );
  } catch (error) {
    console.error('Error in ShareHandlerWrapper:', error);
    return (
      <View style={{ flex: 1 }}>
        {wrapChildren(children)}
      </View>
    );
  }
};

/**
 * Wraps children in <Text> if it's a string or number.
 * Leaves JSX elements unchanged.
 */
function wrapChildren(children) {
  if (typeof children === 'string' || typeof children === 'number') {
    return <Text>{children}</Text>;
  }
  if (Array.isArray(children)) {
    return children.map((child, index) =>
      typeof child === 'string' || typeof child === 'number' ? (
        <Text key={index}>{child}</Text>
      ) : (
        child
      )
    );
  }
  return children;
}

export default ShareHandlerWrapper;
