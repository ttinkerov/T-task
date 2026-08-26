'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  error: Error | null;
};

export class IslandErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[IslandErrorBoundary]', error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="island-error" role="alert">
          <p className="island-error__title">
            {this.props.fallbackTitle ?? 'Не удалось отобразить блок интерфейса.'}
          </p>
          <p className="island-error__text">
            {this.state.error.message || 'Произошла непредвиденная ошибка.'}
          </p>
          <button type="button" className="board-filters__chip" onClick={this.retry}>
            Повторить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
