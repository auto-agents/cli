import React from 'react';
import { render, Text } from 'ink';

class ErrorBoundary extends React.Component {
    state = {
        isCrashed: false
    };

    static getDerivedStateFromError(error) {
        return {
            isCrashed: true
        };
    }

    render() {
        if (this.state.isCrashed) {
            process.exit(1)
            return <Text color="red">Oh no, app crashed</Text>;
        }

        return this.props.children;
    }

    componentDidCatch(error) {
        // Errored while rendering components
    }

    componentDidMount() {
        process.setUncaughtExceptionCaptureCallback(this.crashed)
    }

    componentWillUnmount() {
        process.setUncaughtExceptionCaptureCallback(null)
    }

    crashed = (...args) => {
        this.setState({
            isCrashed: true
        });

        process.exitCode = 1;
    };
}

export default ErrorBoundary
