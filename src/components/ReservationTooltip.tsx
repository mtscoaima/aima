'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import { Reservation, ViewSettings } from '@/app/messages/reservations/calendar/page';

interface ReservationTooltipProps {
  reservation: Reservation;
  viewSettings: ViewSettings;
  timeStr: string;
  children: React.ReactNode;
}

export default function ReservationTooltip({
  reservation,
  viewSettings,
  timeStr,
  children
}: ReservationTooltipProps) {
  // 툴팁에 표시할 항목들을 필터링
  const getTooltipContent = () => {
    const items: { label: string; value: string }[] = [];

    // 공간명은 항상 표시
    items.push({
      label: '공간',
      value: reservation.spaces?.name || '미지정'
    });

    // 보기 설정에서 체크된 항목만 표시
    if (viewSettings.displayInfo.시간) {
      items.push({
        label: '시간',
        value: timeStr
      });
    }

    if (viewSettings.displayInfo.예약자명) {
      items.push({
        label: '예약자',
        value: reservation.customer_name || '미지정'
      });
    }

    if (viewSettings.displayInfo.총금액) {
      items.push({
        label: '금액',
        value: reservation.total_amount.toString() ? `${parseInt(reservation.total_amount.toString()).toLocaleString()}원` : '미지정'
      });
    }

    if (viewSettings.displayInfo.예약채널) {
      let channelDisplay = '';
      switch (reservation.booking_channel) {
        case 'manual':
          channelDisplay = '직접입력';
          break;
        case '선택안함':
          channelDisplay = '직접입력';
          break;
        default:
          channelDisplay = reservation.booking_channel || '미지정';
          break;
      }
      items.push({
        label: '채널',
        value: channelDisplay
      });
    }

    return items;
  };

  const tooltipItems = getTooltipContent();

  return (
    <Tooltip.Root delayDuration={300}>
      <Tooltip.Trigger asChild>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs"
          sideOffset={5}
        >
          <div className="space-y-2">
            {tooltipItems.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 min-w-[48px]">
                  {item.label}:
                </span>
                <span className="text-xs text-gray-800 break-words flex-1">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <Tooltip.Arrow className="fill-white" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
