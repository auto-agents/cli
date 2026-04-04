import React from 'react';
import { render, Text } from 'ink';
import fs from 'fs';
import path from 'path';
import { ERROR_LOG_FILE } from '../../config/config';

class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            isCrashed: false,
            error: null
        };
    }

    static getDerivedStateFromError(error) {
        return {
            isCrashed: true,
            error: error
        };
    }

    render() {
        if (this.state.isCrashed) {
            return <Text color="red">{this.state.error.toString()}</Text>;
        }

        return this.props.children;
    }

    componentDidCatch(error, errorInfo) {
        // Errored while rendering components
        fs.appendFileSync(
            path.join(process.cwd(), ERROR_LOG_FILE),
            error.toString())
    }
}

export default ErrorBoundary
