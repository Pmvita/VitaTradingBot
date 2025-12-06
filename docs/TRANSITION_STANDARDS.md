# Page Transition Standards

## Industry Standard Durations

### Page Transitions
- **Standard Duration**: 800-1200ms (1 second is optimal)
- **Minimum Visible Time**: 600-800ms (to avoid flicker)
- **Fade In/Out**: 300-400ms each

### Why 1000ms (1 second)?
1. **Perceived Performance**: Long enough to feel intentional, not like a bug
2. **No Flicker**: Prevents jarring quick flashes
3. **Smooth UX**: Gives users time to process the transition
4. **Industry Standard**: Used by major platforms:
   - Material Design: 300-500ms (simple), 500-800ms (complex)
   - Apple HIG: 200-500ms (simple), 500-1000ms (complex)
   - React Router: 300-600ms default
   - Next.js: 200-400ms (fast), 500-1000ms (smooth)

### Our Implementation
- **Default Duration**: 1000ms (1 second)
- **Fade Transitions**: 400ms
- **Minimum Display**: 800ms (even if content loads faster)

This ensures:
- ✅ Professional, polished feel
- ✅ No jarring quick transitions
- ✅ Consistent user experience
- ✅ Time for users to process navigation

