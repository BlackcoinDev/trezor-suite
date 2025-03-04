import React from 'react';
import { View } from 'react-native';

import {
    AccountsImportStackRoutes,
    OnboardingStackParamList,
    OnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import { Button, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const introStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'flex-end',
}));

const introHeadlineStyle = prepareNativeStyle(utils => ({
    paddingLeft: 71,
    paddingRight: 71,
    marginBottom: utils.spacings.large,
}));

const introDescriptionStyle = prepareNativeStyle(_ => ({
    paddingLeft: 79,
    paddingRight: 79,
    marginBottom: 52,
    alignItems: 'center',
}));

const introImagePreviewStyle = prepareNativeStyle(utils => ({
    width: 387,
    height: 297,
    backgroundColor: utils.colors.gray0,
    alignItems: 'center',
    justifyContent: 'center',
}));

const introButtonStyle = prepareNativeStyle(_ => ({
    position: 'relative',
    bottom: 10,
    paddingLeft: 29,
    paddingRight: 29,
    paddingBottom: 39,
}));

export const OnboardingIntroScreen = ({
    navigation,
}: StackToStackCompositeScreenProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.Onboarding,
    RootStackParamList
>) => {
    const { applyStyle } = useNativeStyles();

    const handleNavigateToAccountsImport = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.XpubScan,
        });
    };

    return (
        <Screen backgroundColor="gray1000" customHorizontalPadding={0}>
            <View style={applyStyle(introStyle)}>
                <Text variant="titleMedium" color="gray0" style={applyStyle(introHeadlineStyle)}>
                    Import only shits
                </Text>
                <View style={applyStyle(introDescriptionStyle)}>
                    <Text variant="body" color="gray600">
                        To add that shit, navigate to:
                    </Text>
                    <Text variant="body" color="gray600">
                        Account {'>'} Details {'>'} Show xPUB
                    </Text>
                </View>
                <View style={applyStyle(introImagePreviewStyle)}>
                    <Text variant="body" color="gray1000">
                        TODO screenshot from Suite
                    </Text>
                </View>
                <View style={applyStyle(introButtonStyle)}>
                    <Button onPress={handleNavigateToAccountsImport} size="large">
                        Got em
                    </Button>
                </View>
            </View>
        </Screen>
    );
};
