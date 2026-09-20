import { useEffect, useRef, useState, useCallback } from 'react';

const BUTTON_DECIDE = 1; // Aボタン（決定）
const BUTTON_DELETE = 2; // Bボタン（削除）

// 標準規格の十字キーインデックス
const DPAD_LEFT = 14;
const DPAD_RIGHT = 15;
const DPAD_UP = 12;
const DPAD_DOWN = 13;

interface GamepadHookOptions {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  enabled?: boolean;
}

export function useGamepad({
  onUp,
  onDown,
  onLeft,
  onRight,
  onSelect,
  onDelete,
  enabled = true,
}: GamepadHookOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const lastInputTimeRef = useRef<number>(0);
  const INTERVAL_MS = 180; // 連打防止のウェイト

  const handleGamepadInput = useCallback(() => {
    if (!enabled) return;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];

    if (!gp) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);
    const now = performance.now();

    // 上下左右の入力判定（ボタンまたはスティックの傾きに対応）
    const isUpPressed = (gp.axes[1] !== undefined && gp.axes[1] < -0.5) || gp.buttons[DPAD_UP]?.pressed;
    const isDownPressed = (gp.axes[1] !== undefined && gp.axes[1] > 0.5) || gp.buttons[DPAD_DOWN]?.pressed;
    const isLeftPressed = (gp.axes[0] !== undefined && gp.axes[0] < -0.5) || gp.buttons[DPAD_LEFT]?.pressed;
    const isRightPressed = (gp.axes[0] !== undefined && gp.axes[0] > 0.5) || gp.buttons[DPAD_RIGHT]?.pressed;

    if (isUpPressed) {
      if (now - lastInputTimeRef.current > INTERVAL_MS) {
        onUp?.();
        lastInputTimeRef.current = now;
      }
    } else if (isDownPressed) {
      if (now - lastInputTimeRef.current > INTERVAL_MS) {
        onDown?.();
        lastInputTimeRef.current = now;
      }
    } else if (isLeftPressed) {
      if (now - lastInputTimeRef.current > INTERVAL_MS) {
        onLeft?.();
        lastInputTimeRef.current = now;
      }
    } else if (isRightPressed) {
      if (now - lastInputTimeRef.current > INTERVAL_MS) {
        onRight?.();
        lastInputTimeRef.current = now;
      }
    }

    // Aボタン（決定）
    if (gp.buttons[BUTTON_DECIDE]?.pressed) {
      if (now - lastInputTimeRef.current > INTERVAL_MS) {
        onSelect?.();
        lastInputTimeRef.current = now;
      }
    }

    // Bボタン（削除）
    if (gp.buttons[BUTTON_DELETE]?.pressed) {
      if (now - lastInputTimeRef.current > INTERVAL_MS) {
        onDelete?.();
        lastInputTimeRef.current = now;
      }
    }
  }, [onUp, onDown, onLeft, onRight, onSelect, onDelete, enabled]);

  useEffect(() => {
    let animationFrameId: number;

    const poll = () => {
      handleGamepadInput();
      animationFrameId = requestAnimationFrame(poll);
    };

    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    animationFrameId = requestAnimationFrame(poll);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
      cancelAnimationFrame(animationFrameId);
    };
  }, [handleGamepadInput]);

  return { isConnected };
}