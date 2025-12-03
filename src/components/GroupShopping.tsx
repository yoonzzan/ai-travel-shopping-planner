
import { useState } from 'react';
import { ArrowLeft, Users, Plus, CheckCircle, Clock, MessageCircle, Wallet, Filter, ShoppingBag } from 'lucide-react';
import type { ShoppingPlan, GroupMember, ShoppingItem, TravelInfo } from '../types';
import { useGroupShopping } from '../hooks/useGroupShopping';

interface GroupShoppingProps {
  shoppingPlan: ShoppingPlan;
  groupMembers: GroupMember[];
  onUpdateMembers: (members: GroupMember[]) => void;
  onBack: () => void;
  onItemPurchase: (locationId: string, itemId: string, purchasedBy?: string) => void;
  onAddItem: () => void;
  travelInfo: TravelInfo;
}

export function GroupShopping({
  shoppingPlan,
  groupMembers,
  onUpdateMembers,
  onBack,
  onItemPurchase,
  onAddItem,
  travelInfo,
}: GroupShoppingProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmoji, setNewMemberEmoji] = useState('😊');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const {
    chatMessages,
    addMember,
    assignItem,
    sendMessage,
  } = useGroupShopping({
    shoppingPlan,
    groupMembers,
    onUpdateMembers,
    travelInfo,
  });

  const emojiOptions = ['😊', '👨', '👩', '👧', '👦', '👶', '👴', '👵', '🙂', '😎'];

  const handleAddMemberClick = () => {
    if (!newMemberName.trim()) return;
    addMember(newMemberName, newMemberEmoji);
    setNewMemberName('');
    setNewMemberEmoji('😊');
    setShowAddMember(false);
  };

  const handleSendMessageClick = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage('');
  };

  // Organize items by location
  const allLocations = [
    { ...shoppingPlan.dutyFree.departure, displayName: '인천공항 (출국)' },
    ...Object.values(shoppingPlan.cityShopping).map((loc) => ({
      ...loc,
      displayName: loc.location,
    })),
    { ...shoppingPlan.dutyFree.arrival, displayName: '인천공항 (입국)' },
  ];

  const totalBudget = shoppingPlan.budgetSummary.total;
  const spentByMembers = groupMembers.reduce((sum: number, member: GroupMember) => {
    return (
      sum +
      member.items.reduce((itemSum: number, item: ShoppingItem) => {
        return itemSum + (item.purchased ? item.estimatedPrice : 0);
      }, 0)
    );
  }, 0);
  const budgetProgress = totalBudget > 0 ? Math.min((spentByMembers / totalBudget) * 100, 100) : 0;

  // Filter items based on selected member
  const getFilteredItems = (items: ShoppingItem[]) => {
    if (!selectedMemberId) return items;
    return items.filter(item => {
      const assignedMember = groupMembers.find((m: GroupMember) => m.items.some((i: ShoppingItem) => i.id === item.id));
      return assignedMember?.id === selectedMemberId;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-b-3xl shadow-lg">
        <button onClick={onBack} className="flex items-center gap-2 mb-4 hover:opacity-80">
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold mb-1">우리 팀 쇼핑</h1>
            <p className="text-purple-100">함께 쇼핑 리스트 관리하기</p>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="flex items-center gap-1"><Wallet className="w-4 h-4" /> 전체 예산</span>
            <span className="font-bold">{totalBudget.toLocaleString('ko-KR')}원</span>
          </div>
          <div className="h-3 bg-black/20 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${budgetProgress > 90 ? 'bg-red-400' : 'bg-green-400'}`}
              style={{ width: `${budgetProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-purple-100">
            <span>지출: {spentByMembers.toLocaleString('ko-KR')}원</span>
            <span>잔액: {(totalBudget - spentByMembers).toLocaleString('ko-KR')}원</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Members & Filter */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Filter className="w-5 h-5 text-purple-600" />
              멤버별 보기 ({groupMembers.length})
            </h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>멤버 추가</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedMemberId(null)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${selectedMemberId === null
                ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-100'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
            >
              전체
            </button>
            {groupMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id === selectedMemberId ? null : member.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${selectedMemberId === member.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-100'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <span className="text-base">{member.emoji}</span>
                <span>{member.name}</span>
                {member.items.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedMemberId === member.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
                    }`}>
                    {member.items.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-bold mb-4">새 멤버 추가</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="이름 (예: 친구1)"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  autoFocus
                />
                <div>
                  <p className="text-xs text-gray-500 mb-2">이모지 선택</p>
                  <div className="flex flex-wrap gap-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewMemberEmoji(emoji)}
                        className={`text-2xl p-3 rounded-xl transition-all ${newMemberEmoji === emoji
                          ? 'bg-purple-200 scale-110 ring-2 ring-purple-400'
                          : 'bg-white hover:bg-gray-100 border border-gray-100'
                          }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddMemberClick}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-bold shadow-sm"
                  >
                    추가하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settlement Summary */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            정산 요약
          </h2>
          <div className="space-y-3">
            {groupMembers.map(member => {
              const memberSpent = member.items.reduce((sum: number, item: ShoppingItem) => sum + (item.purchased ? item.estimatedPrice : 0), 0);
              const memberTotal = member.items.reduce((sum: number, item: ShoppingItem) => sum + item.estimatedPrice, 0);

              if (memberTotal === 0) return null;

              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-gray-100">
                      {member.emoji}
                    </div>
                    <span className="font-medium text-gray-700">{member.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg">{memberSpent.toLocaleString('ko-KR')}원</div>
                    <div className="text-xs text-gray-400">총 예산 {memberTotal.toLocaleString('ko-KR')}원</div>
                  </div>
                </div>
              );
            })}
            {groupMembers.every(m => m.items.length === 0) && (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">아직 할당된 아이템이 없습니다.</p>
                <p className="text-gray-300 text-xs mt-1">아이템을 추가하고 멤버에게 할당해보세요!</p>
              </div>
            )}
          </div>
        </div>

        {/* Shopping Lists by Location */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-gray-800">장소별 아이템</h2>
            <button
              onClick={onAddItem}
              className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              아이템 추가
            </button>
          </div>

          {allLocations.map((location) => {
            const filteredItems = getFilteredItems(location.items);
            if (filteredItems.length === 0 && selectedMemberId) return null;

            return (
              <div key={location.id} className="bg-white rounded-xl shadow-md p-4">
                <h3 className="mb-3 font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-gray-500" />
                  {location.displayName}
                </h3>

                <div className="space-y-3">
                  {filteredItems.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">아이템이 없습니다.</p>
                  ) : (
                    filteredItems.map((item) => {
                      const assignedMember = groupMembers.find((m: GroupMember) =>
                        m.items.some((i: ShoppingItem) => i.id === item.id)
                      );

                      return (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-3 transition-all ${item.purchased
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-gray-200 bg-white hover:border-purple-200'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium mb-1">{item.product}</h4>
                              <p className="text-xs text-gray-500">
                                {item.estimatedPrice.toLocaleString('ko-KR')}원
                              </p>
                            </div>
                            {item.purchased ? (
                              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                <span className="text-[10px] font-bold">완료</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px]">대기</span>
                              </div>
                            )}
                          </div>

                          {assignedMember ? (
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1.5 text-sm">
                                <span className="text-lg">{assignedMember.emoji}</span>
                                <span className="text-gray-600 text-xs font-medium">
                                  {assignedMember.name}
                                </span>
                              </div>
                              {!item.purchased && (
                                <button
                                  onClick={() =>
                                    onItemPurchase(location.id, item.id, assignedMember.name)
                                  }
                                  className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 shadow-sm transition-colors"
                                >
                                  구매 체크
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3">
                              <p className="text-[10px] text-gray-400 mb-1.5">담당자 지정하기:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {groupMembers.map((member) => (
                                  <button
                                    key={member.id}
                                    onClick={() => assignItem(member.id, item)}
                                    className="flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-md hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all"
                                  >
                                    <span>{member.emoji}</span>
                                    <span>{member.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold">팀 채팅</h2>
          </div>

          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto px-1">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${msg.member === '나' ? 'flex-row-reverse' : ''
                  }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.member === '나'
                    ? 'bg-purple-600 text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                    }`}
                >
                  {msg.member !== '나' && <p className="text-xs mb-1 opacity-70 font-bold">{msg.member}</p>}
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessageClick()}
              placeholder="메시지 입력..."
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSendMessageClick}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition-colors"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
